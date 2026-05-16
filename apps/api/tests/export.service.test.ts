import { describe, expect, it } from "vitest";
import { toSql } from "../src/services/export.service.js";

describe("toSql", () => {
  it("generates create table DDL with primary key and not null constraints", () => {
    expect(toSql("users", [
      { name: "id", type: "UUID", nullable: false, primaryKey: true },
      { name: "email", type: "VARCHAR(255)", nullable: false, unique: true }
    ])).toContain('"email" VARCHAR(255) NOT NULL UNIQUE');
  });
});
