import { createChannel, createClient } from "nice-grpc";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import {
  DataServiceClient,
  DataServiceDefinition,
  GetDataRequest,
} from "./compiled_proto/data.js";

const channel = createChannel("localhost:7777");

const client: DataServiceClient = createClient(DataServiceDefinition, channel);

async function case1() {
  const start1 = process.hrtime.bigint();
  const mem1 = process.memoryUsage().heapUsed;
  let totalSize = 0;
  for await (const data of client.getData({} as GetDataRequest)) {
    totalSize += data.data.byteLength;
  }
  const end1 = process.hrtime.bigint();
  const mem1end = process.memoryUsage().heapUsed;
  return {
    time: (end1 - start1) / 1000000n,
    memory: (mem1end - mem1) / 1024,
    totalSize,
  };
}

async function case2() {
  const start2 = process.hrtime.bigint();
  const mem2 = process.memoryUsage().heapUsed;
  const readable = Readable.from(client.getData({} as GetDataRequest));
  let totalSize = 0;
  await pipeline(readable, async (getData) => {
    for await (const data of getData) {
      totalSize += data.data.byteLength;
    }
  });
  const end2 = process.hrtime.bigint();
  const mem2end = process.memoryUsage().heapUsed;
  return {
    time: (end2 - start2) / 1000000n,
    memory: (mem2end - mem2) / 1024,
    totalSize,
  };
}

async function main() {
  console.log("heat up ...");
  await times(2, case1);
  await times(2, case2);

  console.log("run 10 for await ...");
  const result1 = await times(10, case1);
  displayResults(result1);

  console.log("run 10 pipeline ...");
  const result2 = await times(10, case2);
  displayResults(result2);

  console.log("run mixed pipeline / for await 20 times ...");
  const result3 = await times(10, async () => {
    return [await case1(), await case2()];
  });
  const result4 = result3.reduce(
    (acc, cur) => {
      acc.case1.push(cur[0]);
      acc.case2.push(cur[1]);
      return acc;
    },
    { case1: [], case2: [] }
  );
  displayResults(result4.case1);
  displayResults(result4.case2);

  console.log("run mixed for await / pipeline 20 times ...");
  const result5 = await times(10, async () => {
    return [await case2(), await case1()];
  });
  const result6 = result5.reduce(
    (acc, cur) => {
      acc.case1.push(cur[0]);
      acc.case2.push(cur[1]);
      return acc;
    },
    { case1: [], case2: [] }
  );
  displayResults(result6.case1);
  displayResults(result6.case2);
}

const displayResults = (results: any[]) => {
  console.log(
    "mean time : ",
    Number(
      results.map((r) => r.time).reduce((a, b) => a + b, 0n) /
        BigInt(results.length)
    ),
    "ms"
  );
  console.log(
    "mean memory : ",
    results.map((r) => r.memory).reduce((a, b) => a + b, 0) / results.length,
    "KB"
  );
  console.log(
    "mean total size : ",
    results.map((r) => r.totalSize).reduce((a, b) => a + b, 0) / results.length,
    "B"
  );
};

const times = async (n: number, fn: () => Promise<any>) => {
  const results = [];
  for (let i = 0; i < n; i++) {
    const result = await fn();
    results.push(result);
  }
  return results;
};

main();
