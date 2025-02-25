import { expect, test, describe } from "vitest";
import { extractProcessors, extractSteps, Source } from "@rdfc/js-runner";

const pipeline = `
        @prefix js: <https://w3id.org/conn/js#>.
        @prefix ws: <https://w3id.org/conn/ws#>.
        @prefix : <https://w3id.org/conn#>.
        @prefix owl: <http://www.w3.org/2002/07/owl#>.
        @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
        @prefix sh: <http://www.w3.org/ns/shacl#>.

        <> owl:imports <./node_modules/@rdfc/js-runner/ontology.ttl>, <./processor.ttl>.

        [ ] a :Channel;
          :reader <incoming>.
        [ ] a :Channel;
          :writer <outgoing>.
        <incoming> a js:JsReaderChannel.
        <outgoing> a js:JsWriterChannel.

        [ ] a js:BlankToNamedNodeIdentifiers;
            js:incoming <incoming>;
            js:outgoing <outgoing>;
            js:mime "text/turtle".
    `;

describe("processor", () => {
    test("transform input", async () => {
        const source: Source = {
            value: pipeline,
            baseIRI: process.cwd() + "/config.ttl",
            type: "memory",
        };

        // Parse pipeline into processors.
        const {
            processors,
            quads,
            shapes: config,
        } = await extractProcessors(source);

        // Extract the BlankToNamedNodeIdentifiers processor.
        const env = processors.find((x) =>
            x.ty.value.endsWith("BlankToNamedNodeIdentifiers"),
        )!;
        expect(env).toBeDefined();

        const args = extractSteps(env, quads, config);
        expect(args.length).toBe(1);
        expect(args[0].length).toBe(3);

        const [incoming, outgoing, mime] = args[0];
        expect(incoming.ty.value).toBe(
            "https://w3id.org/conn/js#JsReaderChannel",
        );
        expect(outgoing.ty.value).toBe(
            "https://w3id.org/conn/js#JsWriterChannel",
        );
        expect(mime).toBe("text/turtle");
    });
});
