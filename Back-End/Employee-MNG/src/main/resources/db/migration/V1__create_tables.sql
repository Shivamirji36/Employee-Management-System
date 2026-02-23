-- Person table
CREATE TABLE IF NOT EXISTS person (
    employee_id     VARCHAR(50) PRIMARY KEY,
    salutation      VARCHAR(10),
    first_name      VARCHAR(100),
    middle_name     VARCHAR(100),
    last_name       VARCHAR(100),
    gender          VARCHAR(10),
    dob             DATE,
    mobile          VARCHAR(20)
);

-- Person details table
CREATE TABLE IF NOT EXISTS person_details (
    id                BIGSERIAL PRIMARY KEY,
    employee_id       VARCHAR(50) REFERENCES person(employee_id) ON DELETE CASCADE,
    email             VARCHAR(150),
    designation       VARCHAR(100),
    employee_group    VARCHAR(100),
    reporting_manager VARCHAR(100),
    department        VARCHAR(100),
    status            VARCHAR(20),
    relieving_date    DATE,
    site              VARCHAR(100)
);

-- Address table
CREATE TABLE IF NOT EXISTS address (
    id            BIGSERIAL PRIMARY KEY,
    employee_id   VARCHAR(50) REFERENCES person(employee_id) ON DELETE CASCADE,
    country       VARCHAR(100),
    state         VARCHAR(100),
    city          VARCHAR(100),
    zip_code      VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255)
);