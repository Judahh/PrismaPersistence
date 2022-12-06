CREATE TABLE IF NOT EXISTS Tests (
    _id varchar(24) NOT NULL,
    CONSTRAINT Tests_PK PRIMARY KEY (_id)
);

CREATE TABLE IF NOT EXISTS Objects (
    id varchar(24) NOT NULL,
    test varchar(100),
    testNumber integer,
    CONSTRAINT Objects_PK PRIMARY KEY (id)
);

