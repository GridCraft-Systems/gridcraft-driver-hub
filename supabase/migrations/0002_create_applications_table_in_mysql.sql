CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(255) PRIMARY KEY, -- Storing UUIDs as VARCHAR
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uber_bolt_rating DECIMAL(3, 2), -- For ratings like 4.85
        trips_completed INT,
        years_experience INT,
        platform_profile_screenshot_url TEXT,
        security_deposit BOOLEAN,
        rental_path VARCHAR(255),
        safe_parking BOOLEAN,
        why_join TEXT,
        id_document_url TEXT,
        drivers_license_prdp_url TEXT,
        proof_of_residence_url TEXT
    );