ALTER TABLE "Expenses" ADD COLUMN "ProjectId" integer NULL;

ALTER TABLE "Expenses" ADD CONSTRAINT "FK_Expenses_Projects_ProjectId" FOREIGN KEY ("ProjectId") REFERENCES "Projects" ("Id") ON DELETE SET NULL;

CREATE INDEX "IX_Expenses_ProjectId" ON "Expenses" ("ProjectId");
