import { RevitSocketClient } from "./SocketClient.js";

/**
 * Creates a temporary connection to Revit, executes an operation, and disconnects.
 *
 * BUG FIXES:
 * - Timeout timer is now cleared on success (was leaking and could double-reject)
 * - Error handler cleaned up properly
 * - Handles the case where socket.connect() throws synchronously
 */
export async function withRevitConnection<T>(
    operation: (client: RevitSocketClient) => Promise<T>
): Promise<T> {
    const client = new RevitSocketClient("localhost", 8080);

    try {
        if (!client.isConnected) {
            await new Promise<void>((resolve, reject) => {
                let settled = false;

                const cleanup = () => {
                    client.rawSocket.removeListener("connect", onConnect);
                    client.rawSocket.removeListener("error", onError);
                    clearTimeout(timer);
                };

                const onConnect = () => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    resolve();
                };

                const onError = (err: Error) => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    reject(new Error(`Failed to connect to Revit plugin: ${err.message}. Is the MCP plugin running in Revit?`));
                };

                client.rawSocket.on("connect", onConnect);
                client.rawSocket.on("error", onError);

                const timer = setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    client.disconnect();
                    reject(new Error("Connection to Revit timed out (5s). Is the MCP plugin running in Revit?"));
                }, 5000);

                try {
                    client.connect();
                } catch (err) {
                    if (!settled) {
                        settled = true;
                        cleanup();
                        reject(err instanceof Error ? err : new Error(String(err)));
                    }
                }
            });
        }

        return await operation(client);
    } finally {
        client.disconnect();
    }
}
