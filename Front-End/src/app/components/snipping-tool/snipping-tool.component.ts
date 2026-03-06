import {
  Component, ElementRef, ViewChild,
  OnDestroy, HostListener, NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectButton } from 'primeng/selectbutton';
import html2canvas from 'html2canvas';

type Tool = 'pencil' | 'highlight' | 'crop' | 'rect' | 'circle' | 'line' | 'arrow' | 'eraser' | 'none';
type SnipMode = 'image' | 'record';
type ShapeType = 'rect' | 'circle' | 'line' | 'arrow';
type RecordingState = 'idle' | 'selecting' | 'ready' | 'countdown' | 'recording' | 'paused';

// ─── Drawn-object model (for click-to-erase) ────────────
interface DrawnObject {
  type: 'pencil' | 'highlight' | 'rect' | 'circle' | 'line' | 'arrow';
  color: string;
  strokeWidth: number;
  opacity?: number;       // for highlight
  // Shape coords (rect/circle/line/arrow)
  x1?: number; y1?: number; x2?: number; y2?: number;
  // Freehand points (pencil/highlight)
  points?: { x: number; y: number }[];
}

@Component({
  selector: 'app-snipping-tool',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectButton],
  templateUrl: './snipping-tool.component.html',
  styleUrls: ['./snipping-tool.component.css']
})
export class SnippingToolComponent implements OnDestroy {

  isSnipping = false;
  isDragging = false;
  showEditor = false;
  isCapturing = false;
  showModeSelector = false;

  snipMode: SnipMode | null = null;
  modeOptions = [
    { label: '', value: 'image', icon: 'pi pi-camera' },
    { label: '', value: 'record', icon: 'pi pi-video' }
  ];

  startX = 0; startY = 0;
  selX = 0; selY = 0;
  selW = 0; selH = 0;

  activeTool: Tool = 'none';
  brushColor = '#e63946';
  brushSize = 4;
  highlightColor = '#FFD60A';
  shapeColor = '#3b82f6';
  shapeStrokeWidth = 3;
  canvasW = 0;
  canvasH = 0;

  // Shapes dropdown
  showShapesDropdown = false;
  selectedShape: ShapeType = 'rect';

  // ── Video recording state ──
  recState: RecordingState = 'idle';
  recCountdown = 0;
  recTimerDisplay = '00:00';
  recX = 0; recY = 0; recW = 0; recH = 0;  // recording selection area
  private recStartX = 0; private recStartY = 0;
  private recIsDragging = false;
  private displayStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recHiddenCanvas: HTMLCanvasElement | null = null;
  private recHiddenCtx: CanvasRenderingContext2D | null = null;
  private recVideoEl: HTMLVideoElement | null = null;
  private recRafId = 0;
  private recTimerInterval: any = null;
  private recStartTime = 0;
  private recPausedTime = 0;

  // Re-crop state
  isCropping = false;
  cropStartX = 0; cropStartY = 0;
  cropRectX = 0; cropRectY = 0;
  cropRectW = 0; cropRectH = 0;

  // Object stack for click-to-erase
  drawnObjects: DrawnObject[] = [];
  private hoveredObjectIndex = -1;

  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;
  private ctx!: CanvasRenderingContext2D;
  private snapshotBeforeStroke!: ImageData;
  private originalDataUrl = '';

  // Shape drawing state
  private shapeStartX = 0;
  private shapeStartY = 0;

  // Freehand points being drawn
  private currentPoints: { x: number; y: number }[] = [];

  // Eraser: cached original image for restoring pixels
  private originalImage: HTMLImageElement | null = null;

  // Background capture
  private capturePromise: Promise<HTMLCanvasElement | null> | null = null;
  private capturedCanvas: HTMLCanvasElement | null = null;
  private captureW = 0;
  private captureH = 0;

  @ViewChild('editorCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) { }

  // ─────────────────────────────────────────────────────────
  // Start snipping — INSTANT overlay + background capture
  // ─────────────────────────────────────────────────────────
  toggleModeSelector(): void {
    if (this.showModeSelector) {
      this.showModeSelector = false;
    } else {
      // Reset mode so onChange fires every time user picks an option
      this.snipMode = null;
      this.showModeSelector = true;
    }
  }

  closeModeSelector(): void {
    this.showModeSelector = false;
  }

  onModeSelect(): void {
    if (this.snipMode === 'image') {
      this.showModeSelector = false;
      this.startSnipping();
    } else if (this.snipMode === 'record') {
      this.showModeSelector = false;
      this.startRecordingSelection();
    }
  }

  startSnipping(): void {
    this.capturedCanvas = null;
    this.isSnipping = true;
    this.isDragging = false;
    this.selW = 0;
    this.selH = 0;

    // Kick off capture IN PARALLEL while user drags selection.
    // By the time they finish drawing, capture is usually done.
    this.capturePromise = this.captureViewport();

    this.cdr.detectChanges();
  }

  // ─────────────────────────────────────────────────────────
  // html2canvas — runs outside Angular zone for performance
  // ─────────────────────────────────────────────────────────
  private captureViewport(): Promise<HTMLCanvasElement | null> {
    // Store viewport dimensions NOW so crop calculations use the same values
    this.captureW = window.innerWidth;
    this.captureH = window.innerHeight;

    return this.zone.runOutsideAngular(async () => {
      try {
        const canvas = await html2canvas(document.documentElement, {
          useCORS: true,
          allowTaint: true,
          logging: false,
          scale: 1,  // Force 1:1 pixel mapping — no devicePixelRatio distortion
          scrollX: 0,
          scrollY: 0,
          windowWidth: this.captureW,
          windowHeight: this.captureH,
          width: this.captureW,
          height: this.captureH,
          x: 0,
          y: 0,
          ignoreElements: (el: Element) => {
            // Skip our own snipping tool UI so overlay/masks aren't captured
            return el.tagName?.toLowerCase() === 'app-snipping-tool';
          },
          onclone: (_doc: Document, clonedEl: HTMLElement) => {
            // PERFORMANCE: Remove invisible table rows from the clone.
            // With 11K+ rows, cloning them all takes 4+ seconds.
            // Only the first ~20 rows are visible in the viewport anyway.
            const tbodies = clonedEl.querySelectorAll('table tbody, .p-datatable-tbody');
            tbodies.forEach(tbody => {
              const rows = tbody.querySelectorAll('tr');
              if (rows.length > 30) {
                for (let i = 30; i < rows.length; i++) {
                  rows[i].remove();
                }
              }
            });
          }
        });
        return canvas;
      } catch (err: any) {
        console.warn('[SNIP] Capture failed:', err?.message);
        return null;
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Overlay mouse events for selection rectangle
  // ─────────────────────────────────────────────────────────
  onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.startX = e.clientX; this.startY = e.clientY;
    this.selX = e.clientX; this.selY = e.clientY;
    this.selW = 0; this.selH = 0;
  }

  onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    this.selX = Math.min(e.clientX, this.startX);
    this.selY = Math.min(e.clientY, this.startY);
    this.selW = Math.abs(e.clientX - this.startX);
    this.selH = Math.abs(e.clientY - this.startY);
  }

  onMouseUp(): void {
    if (!this.isDragging || this.selW < 10 || this.selH < 10) {
      this.cancelSnipping(); return;
    }
    const cropX = this.selX, cropY = this.selY;
    const cropW = this.selW, cropH = this.selH;
    this.isDragging = false;
    this.isSnipping = false;

    // Process the capture (async, but called from sync handler)
    this.processCapture(cropX, cropY, cropW, cropH);
  }

  private async processCapture(
    cropX: number, cropY: number,
    cropW: number, cropH: number
  ): Promise<void> {
    this.zone.run(() => {
      this.isCapturing = true;
      this.cdr.detectChanges();
    });

    try {
      // Wait for background capture to finish (may already be done)
      const canvas = await this.capturePromise;
      this.capturedCanvas = canvas;

      this.zone.run(() => {
        this.isCapturing = false;
        if (this.capturedCanvas) {
          this.cropAndOpen(cropX, cropY, cropW, cropH);
        } else {
          // Capture failed, open blank editor
          this.originalDataUrl = '';
          this.canvasW = cropW; this.canvasH = cropH;
          this.openEditor();
        }
        this.cdr.detectChanges();
      });
    } catch {
      this.zone.run(() => {
        this.isCapturing = false;
        this.cdr.detectChanges();
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // Crop the captured canvas to the selection area
  // ─────────────────────────────────────────────────────────
  private cropAndOpen(
    cropX: number, cropY: number,
    cropW: number, cropH: number
  ): void {
    const src = this.capturedCanvas!;
    // Use stored capture-time dimensions, not current window size
    const scaleX = src.width / this.captureW;
    const scaleY = src.height / this.captureH;

    const cropped = document.createElement('canvas');
    cropped.width = cropW;
    cropped.height = cropH;
    const ctx = cropped.getContext('2d')!;

    ctx.drawImage(src,
      cropX * scaleX, cropY * scaleY,
      cropW * scaleX, cropH * scaleY,
      0, 0, cropW, cropH);

    this.originalDataUrl = cropped.toDataURL('image/png');
    this.canvasW = cropW; this.canvasH = cropH;
    this.openEditor();
  }

  // ─────────────────────────────────────────────────────────
  // Open editor
  // ─────────────────────────────────────────────────────────
  private openEditor(): void {
    this.showEditor = true;
    this.activeTool = 'none';
    this.drawnObjects = [];
    this.resetCropState();
    setTimeout(() => {
      const canvas = this.canvasRef?.nativeElement;
      if (!canvas) return;
      canvas.width = this.canvasW;
      canvas.height = this.canvasH;
      this.ctx = canvas.getContext('2d')!;
      if (!this.originalDataUrl) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvasW, this.canvasH);
        return;
      }
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0);
        // Cache original image for redrawing
        this.originalImage = img;
      };
      img.src = this.originalDataUrl;
    }, 60);
  }

  // ─────────────────────────────────────────────────────────
  // Tool selection
  // ─────────────────────────────────────────────────────────
  selectTool(tool: Tool): void {
    this.showShapesDropdown = false;
    if (this.activeTool === tool) {
      this.activeTool = 'none';
    } else {
      this.activeTool = tool;
    }
    if (this.activeTool !== 'crop') {
      this.resetCropState();
    }
  }

  // ─────────────────────────────────────────────────────────
  // Shapes dropdown
  // ─────────────────────────────────────────────────────────
  toggleShapesDropdown(): void {
    this.showShapesDropdown = !this.showShapesDropdown;
  }

  pickShape(shape: ShapeType): void {
    this.selectedShape = shape;
    this.showShapesDropdown = false;
    this.activeTool = shape;
    this.resetCropState();
  }

  isShapeTool(): boolean {
    return ['rect', 'circle', 'line', 'arrow'].includes(this.activeTool);
  }

  // ─────────────────────────────────────────────────────────
  // Canvas mouse events — drawing + crop + eraser click
  // ─────────────────────────────────────────────────────────
  onCanvasDown(e: MouseEvent): void {
    if (this.activeTool === 'none') return;
    this.showShapesDropdown = false;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.activeTool === 'crop') {
      this.isCropping = true;
      this.cropStartX = x; this.cropStartY = y;
      this.cropRectX = x; this.cropRectY = y;
      this.cropRectW = 0; this.cropRectH = 0;
      return;
    }

    // ── ERASER: click to remove entire object ──
    if (this.activeTool === 'eraser') {
      this.eraseObjectAt(x, y);
      return;
    }

    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;
    this.snapshotBeforeStroke = this.ctx.getImageData(
      0, 0, this.canvasW, this.canvasH);

    // For shapes, store starting point
    if (['rect', 'circle', 'line', 'arrow'].includes(this.activeTool)) {
      this.shapeStartX = x;
      this.shapeStartY = y;
    } else {
      // Freehand — start collecting points
      this.currentPoints = [{ x, y }];
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
    }
  }

  onCanvasMove(e: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.activeTool === 'crop' && this.isCropping) {
      this.cropRectX = Math.max(0, Math.min(x, this.cropStartX));
      this.cropRectY = Math.max(0, Math.min(y, this.cropStartY));
      this.cropRectW = Math.min(Math.abs(x - this.cropStartX), this.canvasW - this.cropRectX);
      this.cropRectH = Math.min(Math.abs(y - this.cropStartY), this.canvasH - this.cropRectY);
      return;
    }

    // Eraser hover — highlight hovered object
    if (this.activeTool === 'eraser') {
      const idx = this.findObjectAt(x, y);
      if (idx !== this.hoveredObjectIndex) {
        this.hoveredObjectIndex = idx;
        this.redrawAll();
        if (idx >= 0) {
          this.highlightObject(this.drawnObjects[idx]);
        }
      }
      return;
    }

    if (!this.isDrawing) return;

    if (this.activeTool === 'pencil') {
      this.currentPoints.push({ x, y });
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.brushColor;
      this.ctx.lineWidth = this.brushSize;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    } else if (this.activeTool === 'highlight') {
      this.currentPoints.push({ x, y });
      this.ctx.putImageData(this.snapshotBeforeStroke, 0, 0);
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.hexToRgba(this.highlightColor, 0.4);
      this.ctx.lineWidth = 22;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);
      for (let i = 1; i < this.currentPoints.length; i++) {
        this.ctx.lineTo(this.currentPoints[i].x, this.currentPoints[i].y);
      }
      this.ctx.stroke();
    } else if (['rect', 'circle', 'line', 'arrow'].includes(this.activeTool)) {
      // Live preview: restore snapshot then draw shape at current mouse pos
      this.ctx.putImageData(this.snapshotBeforeStroke, 0, 0);
      this.drawShape(this.activeTool, this.shapeStartX, this.shapeStartY, x, y);
    }
    this.lastX = x; this.lastY = y;
  }

  onCanvasUp(): void {
    if (this.activeTool === 'crop' && this.isCropping) {
      this.isCropping = false;
      return;
    }
    if (!this.isDrawing) return;
    this.isDrawing = false;

    // ── Record the drawn object ──
    if (this.activeTool === 'pencil' && this.currentPoints.length > 1) {
      this.drawnObjects.push({
        type: 'pencil',
        color: this.brushColor,
        strokeWidth: this.brushSize,
        points: [...this.currentPoints]
      });
    } else if (this.activeTool === 'highlight' && this.currentPoints.length > 1) {
      this.drawnObjects.push({
        type: 'highlight',
        color: this.highlightColor,
        strokeWidth: 22,
        opacity: 0.4,
        points: [...this.currentPoints]
      });
    } else if (['rect', 'circle', 'line', 'arrow'].includes(this.activeTool)) {
      this.drawnObjects.push({
        type: this.activeTool as 'rect' | 'circle' | 'line' | 'arrow',
        color: this.shapeColor,
        strokeWidth: this.shapeStrokeWidth,
        x1: this.shapeStartX,
        y1: this.shapeStartY,
        x2: this.lastX,
        y2: this.lastY
      });
    }

    this.currentPoints = [];
    this.ctx.beginPath();
  }

  // ─────────────────────────────────────────────────────────
  // Shape drawing helpers
  // ─────────────────────────────────────────────────────────
  private drawShape(shape: string, x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.strokeStyle = this.shapeColor;
    this.ctx.lineWidth = this.shapeStrokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (shape === 'rect') {
      const rx = Math.min(x1, x2);
      const ry = Math.min(y1, y2);
      const rw = Math.abs(x2 - x1);
      const rh = Math.abs(y2 - y1);
      this.ctx.beginPath();
      this.ctx.rect(rx, ry, rw, rh);
      this.ctx.stroke();
    } else if (shape === 'circle') {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2);
      this.ctx.stroke();
    } else if (shape === 'line') {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    } else if (shape === 'arrow') {
      this.drawArrow(x1, y1, x2, y2);
    }
  }

  private drawArrow(x1: number, y1: number, x2: number, y2: number): void {
    const headLen = 14;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Line shaft
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();

    // Arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(
      x2 - headLen * Math.cos(angle - Math.PI / 6),
      y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(x2, y2);
    this.ctx.lineTo(
      x2 - headLen * Math.cos(angle + Math.PI / 6),
      y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  // ─────────────────────────────────────────────────────────
  // Object-based redraw (used after erasing)
  // ─────────────────────────────────────────────────────────
  private redrawAll(): void {
    // 1. Draw original image
    if (this.originalImage) {
      this.ctx.drawImage(this.originalImage, 0, 0, this.canvasW, this.canvasH);
    } else {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, this.canvasW, this.canvasH);
    }

    // 2. Replay each drawn object
    for (const obj of this.drawnObjects) {
      this.renderObject(obj);
    }
  }

  private renderObject(obj: DrawnObject): void {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (obj.type === 'pencil' && obj.points && obj.points.length > 1) {
      this.ctx.strokeStyle = obj.color;
      this.ctx.lineWidth = obj.strokeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(obj.points[0].x, obj.points[0].y);
      for (let i = 1; i < obj.points.length; i++) {
        this.ctx.lineTo(obj.points[i].x, obj.points[i].y);
      }
      this.ctx.stroke();
    } else if (obj.type === 'highlight' && obj.points && obj.points.length > 1) {
      this.ctx.strokeStyle = this.hexToRgba(obj.color, obj.opacity ?? 0.4);
      this.ctx.lineWidth = obj.strokeWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(obj.points[0].x, obj.points[0].y);
      for (let i = 1; i < obj.points.length; i++) {
        this.ctx.lineTo(obj.points[i].x, obj.points[i].y);
      }
      this.ctx.stroke();
    } else if (['rect', 'circle', 'line', 'arrow'].includes(obj.type)) {
      this.ctx.strokeStyle = obj.color;
      this.ctx.lineWidth = obj.strokeWidth;
      if (obj.type === 'rect') {
        const rx = Math.min(obj.x1!, obj.x2!);
        const ry = Math.min(obj.y1!, obj.y2!);
        const rw = Math.abs(obj.x2! - obj.x1!);
        const rh = Math.abs(obj.y2! - obj.y1!);
        this.ctx.beginPath();
        this.ctx.rect(rx, ry, rw, rh);
        this.ctx.stroke();
      } else if (obj.type === 'circle') {
        const cx = (obj.x1! + obj.x2!) / 2;
        const cy = (obj.y1! + obj.y2!) / 2;
        const rx = Math.abs(obj.x2! - obj.x1!) / 2;
        const ry = Math.abs(obj.y2! - obj.y1!) / 2;
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (obj.type === 'line') {
        this.ctx.beginPath();
        this.ctx.moveTo(obj.x1!, obj.y1!);
        this.ctx.lineTo(obj.x2!, obj.y2!);
        this.ctx.stroke();
      } else if (obj.type === 'arrow') {
        this.ctx.strokeStyle = obj.color;
        this.ctx.lineWidth = obj.strokeWidth;
        this.drawArrow(obj.x1!, obj.y1!, obj.x2!, obj.y2!);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // Eraser — click-to-erase entire object
  // ─────────────────────────────────────────────────────────
  private eraseObjectAt(x: number, y: number): void {
    const idx = this.findObjectAt(x, y);
    if (idx >= 0) {
      this.drawnObjects.splice(idx, 1);
      this.hoveredObjectIndex = -1;
      this.redrawAll();
    }
  }

  private findObjectAt(x: number, y: number): number {
    const tolerance = 8;
    // Search in reverse so topmost object is found first
    for (let i = this.drawnObjects.length - 1; i >= 0; i--) {
      if (this.hitTest(this.drawnObjects[i], x, y, tolerance)) {
        return i;
      }
    }
    return -1;
  }

  private hitTest(obj: DrawnObject, px: number, py: number, tol: number): boolean {
    if (obj.type === 'pencil' || obj.type === 'highlight') {
      if (!obj.points || obj.points.length < 2) return false;
      const halfW = (obj.strokeWidth / 2) + tol;
      for (let i = 1; i < obj.points.length; i++) {
        if (this.distToSegment(px, py,
          obj.points[i - 1].x, obj.points[i - 1].y,
          obj.points[i].x, obj.points[i].y) <= halfW) {
          return true;
        }
      }
      return false;
    }

    if (obj.type === 'rect') {
      const rx = Math.min(obj.x1!, obj.x2!);
      const ry = Math.min(obj.y1!, obj.y2!);
      const rw = Math.abs(obj.x2! - obj.x1!);
      const rh = Math.abs(obj.y2! - obj.y1!);
      // Near top edge, bottom edge, left edge, or right edge
      const nearTop = Math.abs(py - ry) <= tol && px >= rx - tol && px <= rx + rw + tol;
      const nearBot = Math.abs(py - (ry + rh)) <= tol && px >= rx - tol && px <= rx + rw + tol;
      const nearLeft = Math.abs(px - rx) <= tol && py >= ry - tol && py <= ry + rh + tol;
      const nearRight = Math.abs(px - (rx + rw)) <= tol && py >= ry - tol && py <= ry + rh + tol;
      // Also: inside the rectangle counts
      const inside = px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
      return nearTop || nearBot || nearLeft || nearRight || inside;
    }

    if (obj.type === 'circle') {
      const cx = (obj.x1! + obj.x2!) / 2;
      const cy = (obj.y1! + obj.y2!) / 2;
      const rx = Math.abs(obj.x2! - obj.x1!) / 2;
      const ry = Math.abs(obj.y2! - obj.y1!) / 2;
      if (rx < 1 || ry < 1) return false;
      // Point on ellipse: (px-cx)^2/rx^2 + (py-cy)^2/ry^2 ≈ 1
      const val = ((px - cx) ** 2) / (rx ** 2) + ((py - cy) ** 2) / (ry ** 2);
      return val <= 1 + (tol / Math.min(rx, ry));
    }

    if (obj.type === 'line' || obj.type === 'arrow') {
      return this.distToSegment(px, py, obj.x1!, obj.y1!, obj.x2!, obj.y2!) <= tol;
    }

    return false;
  }

  private distToSegment(px: number, py: number,
    x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  // Visual feedback: highlight the object the eraser is hovering over
  private highlightObject(obj: DrawnObject): void {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.strokeStyle = '#ff4444';
    this.ctx.lineWidth = (obj.strokeWidth || 3) + 4;
    this.ctx.setLineDash([6, 4]);
    this.ctx.globalAlpha = 0.6;

    if (obj.type === 'pencil' || obj.type === 'highlight') {
      if (obj.points && obj.points.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          this.ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
        this.ctx.stroke();
      }
    } else if (obj.type === 'rect') {
      const rx = Math.min(obj.x1!, obj.x2!);
      const ry = Math.min(obj.y1!, obj.y2!);
      this.ctx.beginPath();
      this.ctx.rect(rx, ry, Math.abs(obj.x2! - obj.x1!), Math.abs(obj.y2! - obj.y1!));
      this.ctx.stroke();
    } else if (obj.type === 'circle') {
      const cx = (obj.x1! + obj.x2!) / 2;
      const cy = (obj.y1! + obj.y2!) / 2;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy,
        Math.max(Math.abs(obj.x2! - obj.x1!) / 2, 0.1),
        Math.max(Math.abs(obj.y2! - obj.y1!) / 2, 0.1),
        0, 0, Math.PI * 2);
      this.ctx.stroke();
    } else if (obj.type === 'line' || obj.type === 'arrow') {
      this.ctx.beginPath();
      this.ctx.moveTo(obj.x1!, obj.y1!);
      this.ctx.lineTo(obj.x2!, obj.y2!);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // ─────────────────────────────────────────────────────────
  // Crop
  // ─────────────────────────────────────────────────────────
  applyCrop(): void {
    if (this.cropRectW < 10 || this.cropRectH < 10) return;

    const imageData = this.ctx.getImageData(
      this.cropRectX, this.cropRectY,
      this.cropRectW, this.cropRectH);

    this.canvasW = this.cropRectW;
    this.canvasH = this.cropRectH;

    setTimeout(() => {
      const canvas = this.canvasRef.nativeElement;
      canvas.width = this.canvasW;
      canvas.height = this.canvasH;
      this.ctx = canvas.getContext('2d')!;
      this.ctx.putImageData(imageData, 0, 0);
      this.originalDataUrl = canvas.toDataURL('image/png');
      // After crop, rebuild original image and clear objects
      const img = new Image();
      img.onload = () => { this.originalImage = img; };
      img.src = this.originalDataUrl;
      this.drawnObjects = [];
      this.resetCropState();
      this.activeTool = 'none';
      this.cdr.detectChanges();
    });
  }

  cancelCrop(): void {
    this.resetCropState();
    this.activeTool = 'none';
  }

  private resetCropState(): void {
    this.isCropping = false;
    this.cropRectX = 0; this.cropRectY = 0;
    this.cropRectW = 0; this.cropRectH = 0;
  }

  // ─────────────────────────────────────────────────────────
  // Reset / Save / Close
  // ─────────────────────────────────────────────────────────
  resetCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.canvasW;
    canvas.height = this.canvasH;
    this.ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => this.ctx.drawImage(img, 0, 0);
    img.src = this.originalDataUrl;
    this.drawnObjects = [];
    this.resetCropState();
    this.activeTool = 'none';
  }

  saveScreenshot(): void {
    const link = document.createElement('a');
    link.download = `screenshot-${Date.now()}.png`;
    link.href = this.canvasRef.nativeElement.toDataURL('image/png');
    link.click();
  }

  closeEditor(): void {
    this.showEditor = false;
    this.activeTool = 'none';
    this.isDrawing = false;
    this.showShapesDropdown = false;
    this.resetCropState();
    // Full cleanup so next snip starts fresh
    this.capturePromise = null;
    this.capturedCanvas = null;
    this.originalDataUrl = '';
    this.canvasW = 0;
    this.canvasH = 0;
    this.drawnObjects = [];
    this.hoveredObjectIndex = -1;
  }

  cancelSnipping(): void {
    this.isSnipping = false; this.isDragging = false;
  }

  // ═════════════════════════════════════════════════════════
  //  VIDEO RECORDING
  // ═════════════════════════════════════════════════════════

  // ── Step 1: Show gray overlay, user drags to select area ──
  private startRecordingSelection(): void {
    this.recState = 'selecting';
    this.recW = 0; this.recH = 0;
    this.recIsDragging = false;
    this.cdr.detectChanges();
  }

  onRecMouseDown(e: MouseEvent): void {
    if (this.recState !== 'selecting' && this.recState !== 'ready') return;
    this.recIsDragging = true;
    this.recStartX = e.clientX;
    this.recStartY = e.clientY;
    this.recX = e.clientX;
    this.recY = e.clientY;
    this.recW = 0;
    this.recH = 0;
    // If re-selecting from 'ready' state, go back to 'selecting'
    if (this.recState === 'ready') {
      this.recState = 'selecting';
    }
  }

  onRecMouseMove(e: MouseEvent): void {
    if (!this.recIsDragging) return;
    this.recX = Math.min(e.clientX, this.recStartX);
    this.recY = Math.min(e.clientY, this.recStartY);
    this.recW = Math.abs(e.clientX - this.recStartX);
    this.recH = Math.abs(e.clientY - this.recStartY);
  }

  onRecMouseUp(): void {
    if (!this.recIsDragging) return;
    this.recIsDragging = false;
    if (this.recW < 30 || this.recH < 30) {
      this.recW = 0; this.recH = 0;
      return;
    }
    this.recState = 'ready';
    this.cdr.detectChanges();
  }

  // ── Resize: re-select the area ──
  recResize(): void {
    this.recState = 'selecting';
    this.recW = 0; this.recH = 0;
    this.cdr.detectChanges();
  }

  // ── Step 2: Ask permission, countdown, then start recording ──
  async recStart(): Promise<void> {
    // Request screen capture permission
    try {
      this.displayStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: {
          frameRate: 30,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
        preferCurrentTab: true   // Prefer current tab for accurate coordinates
      } as any);
    } catch {
      console.warn('[REC] User cancelled screen share');
      return;
    }

    // When user stops sharing via browser UI, clean up
    this.displayStream!.getVideoTracks()[0].addEventListener('ended', () => {
      this.zone.run(() => this.recStop());
    });

    // Countdown 3 → 2 → 1
    this.recState = 'countdown';
    for (let i = 3; i >= 1; i--) {
      this.recCountdown = i;
      this.cdr.detectChanges();
      await this.delay(1000);
    }
    this.recCountdown = 0;

    // Set up hidden canvas + video element for cropping
    this.setupCropRecording();

    // Start MediaRecorder — prefer MP4/H.264, fall back to VP9/WebM
    const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
      ? 'video/mp4;codecs=avc1'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

    const croppedStream = this.recHiddenCanvas!.captureStream(30);
    this.mediaRecorder = new MediaRecorder(croppedStream, {
      mimeType,
      videoBitsPerSecond: 8_000_000  // 8 Mbps for crisp 1080p
    });
    this.recordedChunks = [];
    this.mediaRecorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) this.recordedChunks.push(ev.data);
    };
    this.mediaRecorder.onstop = () => this.onRecordingStopped();
    this.mediaRecorder.start(200);

    this.recState = 'recording';
    this.recStartTime = Date.now();
    this.recPausedTime = 0;
    this.startRecTimer();
    this.cdr.detectChanges();
  }

  // ── Computed position for recording controls (OUTSIDE the recorded area) ──
  get recControlsTop(): number {
    const barHeight = 52;
    const gap = 12;
    const spaceBelow = window.innerHeight - (this.recY + this.recH);
    if (spaceBelow >= barHeight + gap) {
      return this.recY + this.recH + gap;
    }
    if (this.recY >= barHeight + gap) {
      return this.recY - barHeight - gap;
    }
    return window.innerHeight - barHeight - gap;
  }

  // ── Position for Start/Resize/Cancel bar (above or below selection) ──
  get recBarTop(): number {
    const barHeight = 46;
    const gap = 10;
    // If there's enough space above, place above
    if (this.recY >= barHeight + gap) {
      return this.recY - barHeight - gap;
    }
    // Otherwise place below the selection
    return this.recY + this.recH + gap;
  }

  // ── Set up hidden canvas that crops the display stream ──
  private setupCropRecording(): void {
    // Create hidden video element to play the display stream
    this.recVideoEl = document.createElement('video');
    this.recVideoEl.srcObject = this.displayStream;
    this.recVideoEl.muted = true;
    this.recVideoEl.play();

    // Create hidden canvas sized to the selection
    this.recHiddenCanvas = document.createElement('canvas');
    this.recHiddenCanvas.width = this.recW;
    this.recHiddenCanvas.height = this.recH;
    this.recHiddenCtx = this.recHiddenCanvas.getContext('2d')!;

    // Save selection coordinates at recording start (they won't change)
    const selX = this.recX;
    const selY = this.recY;
    const selW = this.recW;
    const selH = this.recH;

    // Use requestAnimationFrame to continuously crop
    const drawFrame = () => {
      if (!this.recHiddenCtx || !this.recVideoEl) return;
      const video = this.recVideoEl;
      if (video.videoWidth === 0) {
        this.recRafId = requestAnimationFrame(drawFrame);
        return;
      }

      // Detect if user shared the entire screen vs just this tab
      // Tab capture: video dimensions ≈ viewport dimensions
      // Screen capture: video dimensions ≈ screen resolution (much larger)
      const isScreenCapture =
        Math.abs(video.videoWidth - window.screen.width) < 100 &&
        Math.abs(video.videoHeight - window.screen.height) < 100;

      let srcX: number, srcY: number, srcW: number, srcH: number;

      if (isScreenCapture) {
        // Screen capture: add browser chrome offset
        // window.screenX/Y = window position on screen
        // outerWidth - innerWidth = left chrome border (usually tiny)
        // outerHeight - innerHeight = top chrome (address bar, tabs)
        const chromeLeft = (window.outerWidth - window.innerWidth) / 2;
        const chromeTop = window.outerHeight - window.innerHeight - chromeLeft;
        const scaleX = video.videoWidth / window.screen.width;
        const scaleY = video.videoHeight / window.screen.height;

        srcX = (window.screenX + chromeLeft + selX) * scaleX;
        srcY = (window.screenY + chromeTop + selY) * scaleY;
        srcW = selW * scaleX;
        srcH = selH * scaleY;
      } else {
        // Tab capture: viewport coordinates map directly
        const scaleX = video.videoWidth / window.innerWidth;
        const scaleY = video.videoHeight / window.innerHeight;

        srcX = selX * scaleX;
        srcY = selY * scaleY;
        srcW = selW * scaleX;
        srcH = selH * scaleY;
      }

      this.recHiddenCtx.drawImage(
        video,
        srcX, srcY, srcW, srcH,   // source crop
        0, 0, selW, selH           // destination
      );
      this.recRafId = requestAnimationFrame(drawFrame);
    };
    this.recRafId = requestAnimationFrame(drawFrame);
  }

  // ── Pause / Resume ──
  recPause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
      this.recState = 'paused';
      this.recPausedTime = Date.now();
      this.stopRecTimer();
      this.cdr.detectChanges();
    }
  }

  recResume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      // Adjust start time to account for paused duration
      this.recStartTime += (Date.now() - this.recPausedTime);
      this.mediaRecorder.resume();
      this.recState = 'recording';
      this.startRecTimer();
      this.cdr.detectChanges();
    }
  }

  // ── Stop recording ──
  recStop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.stopRecTimer();
    cancelAnimationFrame(this.recRafId);

    // Stop all tracks on the display stream
    this.displayStream?.getTracks().forEach(t => t.stop());
    this.recVideoEl?.pause();
  }

  private onRecordingStopped(): void {
    const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);

    this.cleanupRecording();
    this.zone.run(() => this.cdr.detectChanges());
  }

  recCancel(): void {
    this.recStop();
    this.cleanupRecording();
  }

  private cleanupRecording(): void {
    cancelAnimationFrame(this.recRafId);
    this.stopRecTimer();
    this.displayStream?.getTracks().forEach(t => t.stop());
    this.displayStream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recHiddenCanvas = null;
    this.recHiddenCtx = null;
    this.recVideoEl = null;
    this.recState = 'idle';
    this.recW = 0; this.recH = 0;
    this.recTimerDisplay = '00:00';
  }

  // ── Timer ──
  private startRecTimer(): void {
    this.recTimerInterval = setInterval(() => {
      const elapsed = Date.now() - this.recStartTime;
      const totalSecs = Math.floor(elapsed / 1000);
      const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
      const secs = (totalSecs % 60).toString().padStart(2, '0');
      this.recTimerDisplay = `${mins}:${secs}`;
      this.cdr.detectChanges();
    }, 500);
  }

  private stopRecTimer(): void {
    if (this.recTimerInterval) {
      clearInterval(this.recTimerInterval);
      this.recTimerInterval = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.showShapesDropdown) { this.showShapesDropdown = false; return; }
    if (this.recState === 'selecting' || this.recState === 'ready') { this.cleanupRecording(); return; }
    if (this.recState === 'recording' || this.recState === 'paused') { this.recStop(); return; }
    if (this.showModeSelector) this.closeModeSelector();
    else if (this.isSnipping) this.cancelSnipping();
    else if (this.showEditor) this.closeEditor();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    // Close shapes dropdown when clicking outside
    if (!this.showShapesDropdown) return;
    const target = e.target as HTMLElement;
    if (!target.closest('.shapes-dropdown-wrapper')) {
      this.showShapesDropdown = false;
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  get cursorStyle(): string {
    if (this.activeTool === 'pencil') return 'crosshair';
    if (this.activeTool === 'highlight') return 'cell';
    if (this.activeTool === 'crop') return 'crosshair';
    if (['rect', 'circle', 'line', 'arrow'].includes(this.activeTool)) return 'crosshair';
    if (this.activeTool === 'eraser') return 'pointer';
    return 'default';
  }

  ngOnDestroy(): void {
    this.cleanupRecording();
  }
}