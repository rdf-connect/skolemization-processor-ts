import { expect, test, describe } from "vitest";
import { ProcHelper } from "@rdfc/js-runner/lib/testUtils";
import { SkolemizeProcessor } from "../src/";
import { resolve } from "path";

const pipeline = `
        @prefix rdfc: <https://w3id.org/rdf-connect#>.

        <incoming> a rdfc:Reader.
        <outgoing> a rdfc:Writer.

        <http://example.org/proc> a rdfc:Skolemize;
            rdfc:incoming <incoming>;
            rdfc:outgoing <outgoing>;
            rdfc:mime "text/turtle".
    `;

describe("processor", () => {
    test("transform input", async () => {
        const helper = new ProcHelper<SkolemizeProcessor>();
        await helper.importFile(resolve("./processor.ttl"));
        await helper.importInline(resolve("./pipeline.ttl"), pipeline);

        const config = helper.getConfig("Skolemize");
        expect(config.location).toBeDefined();
        expect(config.file).toBeDefined();
        expect(config.clazz).toBe("SkolemizeProcessor");
        // Parse pipeline into processors.

        const proc = await helper.getProcessor("http://example.org/proc");
        expect(proc.incoming.constructor.name).toBe("ReaderInstance");
        expect(proc.outgoing.constructor.name).toBe("WriterInstance");
        expect(proc.mime).toBe("text/turtle");
    });
});
