CREATE TABLE "User" (
    "Address" text NOT NULL PRIMARY KEY,
    "CreateDt" timestamp without time zone NOT NULL,
    "KYCMethod" text,
    "KYCAux" text,
    "Email" text
);

CREATE INDEX "IX_UserKYC" ON "User" USING btree ("KYCMethod", "KYCAux");

CREATE TABLE "Vote" (
    "Address" text NOT NULL PRIMARY KEY,
    "CreateDt" timestamp without time zone NOT NULL,
    "PollId" numeric(20,0) NOT NULL,
    "Message" text,
    "Signature" text
);

