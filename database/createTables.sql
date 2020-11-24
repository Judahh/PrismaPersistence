CREATE TABLE IF NOT EXISTS Tests (
        _id varchar(24) NOT NULL,
        CONSTRAINT Tests_PK PRIMARY KEY (_id)
);

CREATE TABLE IF NOT EXISTS Object (
        _id SERIAL UNIQUE,
        -- _id varchar (24) NOT NULL,
        -- id varchar (24) NOT NULL,

        string VARCHAR(100),
        number INTEGER,
        CONSTRAINT Object_PK PRIMARY KEY (_id)
        -- CONSTRAINT Object_PK PRIMARY KEY (_id)

);

CREATE TABLE IF NOT EXISTS Objects (
        id varchar(24) NOT NULL,
        test VARCHAR(100),
        testNumber INTEGER,
        CONSTRAINT Objects_PK PRIMARY KEY (id)
);
