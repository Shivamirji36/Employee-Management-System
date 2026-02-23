CREATE OR REPLACE FUNCTION get_employee_by_id(p_employee_id VARCHAR)
RETURNS TABLE (
    employee_id       VARCHAR,
    salutation        VARCHAR,
    first_name        VARCHAR,
    middle_name       VARCHAR,
    last_name         VARCHAR,
    gender            VARCHAR,
    dob               DATE,
    mobile            VARCHAR,
    email             VARCHAR,
    designation       VARCHAR,
    employee_group    VARCHAR,
    reporting_manager VARCHAR,
    department        VARCHAR,
    status            VARCHAR,
    relieving_date    DATE,
    site              VARCHAR,
    country           VARCHAR,
    state             VARCHAR,
    city              VARCHAR,
    zip_code          VARCHAR,
    address_line1     VARCHAR,
    address_line2     VARCHAR
)
LANGUAGE sql
AS $$
    SELECT
        p.employee_id,
        p.salutation,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.gender,
        p.dob,
        p.mobile,
        pd.email,
        pd.designation,
        pd.employee_group,
        pd.reporting_manager,
        pd.department,
        pd.status,
        pd.relieving_date,
        pd.site,
        a.country,
        a.state,
        a.city,
        a.zip_code,
        a.address_line1,
        a.address_line2
    FROM person p
    LEFT JOIN person_details pd ON p.employee_id = pd.employee_id
    LEFT JOIN address a ON p.employee_id = a.employee_id
    WHERE p.employee_id = p_employee_id;
$$;
-- REPORT FUNCTIONS