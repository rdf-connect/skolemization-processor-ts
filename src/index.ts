import { Processor, Reader, Writer } from "@rdfc/js-runner";
import { Readable } from "stream";
import rdf from "rdf-ext";
import formatsPretty from "@rdfjs/formats/pretty.js";
import Serializer from "@rdfjs/serializer-turtle";
import { v4 as uuidv4 } from "uuid";
import { getLoggerFor } from "./utils/logUtil";

const logger = getLoggerFor("processor");

/**
 * rdf-connect processor to map entities with blank node identifiers to equivalents with named node identifiers.
 *
 * @param incoming The data stream which must be transformed.
 * @param outgoing The data stream into which the resulting stream is written.
 * @param mime The MIME type of the data stream.
 */
export type Args = {
    incoming: Reader;
    outgoing: Writer;
    mime: string;
};
export class SkolemizeProcessor extends Processor<Args> {
    parser: NonNullable<ReturnType<typeof rdf.formats.parsers.get>>;
    serializer: Serializer = new Serializer();
    async init(this: Args & this): Promise<void> {
        this.mime = this.mime ?? "text/turtle";

        const parser = rdf.formats.parsers.get(this.mime);
        if (!parser) {
            logger.error(`No parser found for MIME type ${this.mime}.`);
            throw new Error(`No parser found for MIME type ${this.mime}.`);
        } else {
            this.parser = parser;
        }

        // Extend formatting with pretty formats.
        rdf.formats.import(formatsPretty);
    }
    async transform(this: Args & this): Promise<void> {
        for await (const st of this.incoming.streams()) {
            // Data contains quads with blank node identifiers.
            // We transform these to named node identifiers.
            const rawStream = Readable.from(st);
            const quadStream = this.parser.import(rawStream);
            const dataset = await rdf.dataset().import(quadStream);

            // Get all blank node identifiers.
            const blankNodes = dataset.filter(
                (quad) => quad.subject.termType === "BlankNode",
            );

            // Map blank node identifiers to named node identifiers.
            blankNodes.forEach((quad) => {
                const blankNode = quad.subject;

                // Create a named node identifier.
                const namedNode = rdf.namedNode(`urn:bn2nn-id:${uuidv4()}`);

                logger.debug(
                    `Mapping blank node ${blankNode.value} to named node ${namedNode.value}.`,
                );

                // Find all quads with the blank node as subject and replace the subject with the named node.
                const quadsMatchingSubject = dataset.match(blankNode);
                quadsMatchingSubject.forEach((quad) => {
                    dataset.delete(quad);
                    dataset.add(
                        rdf.quad(
                            namedNode,
                            quad.predicate,
                            quad.object,
                            quad.graph,
                        ),
                    );
                });

                // Find all quads with the blank node as predicate and replace the predicate with the named node.
                const quadsMatchingPredicate = dataset.match(null, blankNode);
                quadsMatchingPredicate.forEach((quad) => {
                    dataset.delete(quad);
                    dataset.add(
                        rdf.quad(
                            quad.subject,
                            namedNode,
                            quad.object,
                            quad.graph,
                        ),
                    );
                });

                // Find all quads with the blank node as object and replace the object with the named node.
                const quadsMatchingObject = dataset.match(
                    null,
                    null,
                    blankNode,
                );
                quadsMatchingObject.forEach((quad) => {
                    dataset.delete(quad);
                    dataset.add(
                        rdf.quad(
                            quad.subject,
                            quad.predicate,
                            namedNode,
                            quad.graph,
                        ),
                    );
                });

                // Find all quads with the blank node as graph and replace the graph with the named node.
                const quadsMatchingGraph = dataset.match(
                    null,
                    null,
                    null,
                    blankNode,
                );
                quadsMatchingGraph.forEach((quad) => {
                    dataset.delete(quad);
                    dataset.add(
                        rdf.quad(
                            quad.subject,
                            quad.predicate,
                            quad.object,
                            namedNode,
                        ),
                    );
                });
            });

            // Serialize the quads with named node identifiers.
            const resultRaw = this.serializer.transform(dataset);
            await this.outgoing.string(resultRaw);
        }
        await this.outgoing.close();
    }
    async produce(this: Args & this): Promise<void> {}
}
