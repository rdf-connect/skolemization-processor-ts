# Skolemization Processor

[![Build and tests with Node.js](https://github.com/rdf-connect/blank-to-named-node-identifiers-processor-ts/actions/workflows/build-test.yml/badge.svg)](https://github.com/rdf-connect/blank-to-named-node-identifiers-processor-ts/actions/workflows/build-test.yml)

Install
```bash
npm install @rdfc/skolemization-processor-ts
```

Pipeline
```turtle
@prefix rdfc: <https://w3id.org/rdf-connect#>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.

### Import the processor definitions
<> owl:imports <./node_modules/@rdfc/skolemize-processor-ts/processor.ttl>.

### Define the channels your processor needs
<in> a rdfc:Reader, rdfc:Writer.
<out> a rdfc:Reader, rdfc:Writer.

### Attach the processor to the pipeline under the NodeRunner
# Add the `rdfc:processor <skolemize>` statement under the `rdfc:consistsOf` statement of the `rdfc:NodeRunner`

### Define and configure the processors
<skolemize> a rdfc:Skolemize;
    rdfc:incoming <in>;
    rdfc:outgoing <out>;
    rdfc:meme "text/turtle".
```

This repository contains a RDF-Connect processor to map entities with blank node identifiers to equivalents with named
node identifiers.
It will also replace the references to the blank node identifiers with the named node identifiers.

