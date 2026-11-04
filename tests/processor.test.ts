import { expect, test, describe } from "vitest";
import { ProcHelper } from "@rdfc/js-runner/lib/testUtils";
import { SkolemizationProcessor } from "../src/";
import { resolve } from "path";

const pipeline = `
        @prefix rdfc: <https://w3id.org/rdf-connect#>.
        @prefix rdfcp: <https://w3id.org/rdf-connect/processors#>.

        <incoming> a rdfc:Reader.
        <outgoing> a rdfc:Writer.

        <http://example.org/proc> a rdfcp:SkolemizationProcessor;
            rdfcp:incoming <incoming>;
            rdfcp:outgoing <outgoing>;
            rdfcp:mime "text/turtle".
    `;

describe("processor", () => {
    test("transform input", async () => {
        const helper = new ProcHelper<SkolemizationProcessor>();
        await helper.importFile(resolve("./processor.ttl"));
        await helper.importInline(resolve("./pipeline.ttl"), pipeline);

        const config = helper.getConfig("SkolemizationProcessor");
        expect(config.location).toBeDefined();
        expect(config.file).toBeDefined();
        expect(config.clazz).toBe("SkolemizationProcessor");
        // Parse pipeline into processors.

        const proc = await helper.getProcessor("http://example.org/proc");
        expect(proc.incoming.constructor.name).toBe("ReaderInstance");
        expect(proc.outgoing.constructor.name).toBe("WriterInstance");
        expect(proc.mime).toBe("text/turtle");
    });

    test("falls back to its default values", async () => {
        const minimalPipeline = `
        @prefix rdfc: <https://w3id.org/rdf-connect#>.
        @prefix rdfcp: <https://w3id.org/rdf-connect/processors#>.

        <incoming> a rdfc:Reader.
        <outgoing> a rdfc:Writer.

        <http://example.org/proc> a rdfcp:SkolemizationProcessor;
            rdfcp:incoming <incoming>;
            rdfcp:outgoing <outgoing>.
    `;

        const helper = new ProcHelper<SkolemizationProcessor>();
        await helper.importFile(resolve("./processor.ttl"));
        await helper.importInline(resolve("./pipeline.ttl"), minimalPipeline);
        helper.getConfig("SkolemizationProcessor");

        const proc = await helper.getProcessor("http://example.org/proc");
        expect(proc.mime).toBe("text/turtle");
    });
});
