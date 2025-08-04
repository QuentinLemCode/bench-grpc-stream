import { createServer, ServiceImplementation } from "nice-grpc";
import {
  DataServiceDefinition,
  GetDataRequest,
} from "./compiled_proto/data.js";
import { randomInt } from "node:crypto";

const exampleServiceImpl: ServiceImplementation<DataServiceDefinition> = {
  async *getData(request: GetDataRequest) {
    for (let i = 0; i < 1000; i++) {
      const randomBytes = new Array(128).fill(0).map(() => randomInt(0, 255));
      yield { data: new Uint8Array(randomBytes), count: i };
    }
  },
};

const server = createServer();

server.add(DataServiceDefinition, exampleServiceImpl);

await server.listen("0.0.0.0:7777");
