type Column = {
  name: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  default?: string;
};

function quoteIdent(name: string, rdbms: string) {
  return rdbms === "mysql" ? `\`${name}\`` : `"${name}"`;
}

export function toSql(tableName: string, columns: Column[], rdbms = "postgresql") {
  const columnLines = columns.map((column) => {
    const parts = [quoteIdent(column.name, rdbms), column.type];
    if (column.primaryKey) parts.push("PRIMARY KEY");
    if (column.nullable === false) parts.push("NOT NULL");
    if (column.unique) parts.push("UNIQUE");
    if (column.default) parts.push(`DEFAULT ${column.default}`);
    return `  ${parts.join(" ")}`;
  });
  return `CREATE TABLE ${quoteIdent(tableName, rdbms)} (\n${columnLines.join(",\n")}\n);`;
}
