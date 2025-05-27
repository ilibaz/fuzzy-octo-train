declare module 'memory-cache' {
    function put<T>(key: string, value: T, time?: number): void;
    function get<T>(key: string): T | null;
    function del(key: string): void;
    function clear(): void;

    const cache: {
        put: typeof put;
        get: typeof get;
        del: typeof del;
        clear: typeof clear;
    };

    export default cache;
} 