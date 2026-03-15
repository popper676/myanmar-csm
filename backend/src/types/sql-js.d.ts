declare module 'sql.js' {
  interface QueryResults {
    columns: string[];
    values: any[][];
  }

  interface ParamsObject {
    [key: string]: any;
  }

  type BindParams = any[] | ParamsObject | null;

  interface Statement {
    bind(params?: BindParams): boolean;
    step(): boolean;
    getAsObject(params?: ParamsObject): Record<string, any>;
    get(params?: BindParams): any[];
    run(params?: BindParams): void;
    free(): boolean;
    reset(): void;
  }

  class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);
    run(sql: string, params?: BindParams): Database;
    exec(sql: string, params?: BindParams): QueryResults[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  interface SqlJsStatic {
    Database: typeof Database;
  }

  export type { Database, Statement, QueryResults, SqlJsStatic, BindParams, ParamsObject };
  export default function initSqlJs(config?: any): Promise<SqlJsStatic>;
}
