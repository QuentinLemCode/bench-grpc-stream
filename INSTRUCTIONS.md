Write a benchmark for node js stream and nice gRPC client. It should be fully in typescript.

Initialize the project with node and npm as an ES module.
Install typescript and use the flags "erasableSyntax" to make the code executable directly by NodeJS.

Considering we have a gRPC endpoint that return lots of data. We want the code to create a channel of 256MB and a client.
Then we call the client and it return an async iterable.

The code should benchmark which way is better : 

Case 1 :
for await (const data of client.getData()) {
  console.log("received data")
}

Case 2 : 
const readable = Readable.from(client.getData())

await pipeline(stream, async (getData) => {
  for await(const data of getData) {
    console.log("received data")
  }
}






The code should check which case is faster, and which one use the less memory.

You will have to provide a test gRPC endpoint that will return a load of dummy data.
