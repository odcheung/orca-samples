import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { getOrca, OrcaPoolConfig, OrcaU64 } from "@orca-so/sdk";
import { readFile } from "mz/fs";
import Decimal from "decimal.js";

let connection: Connection | undefined;

async function getKeyPair(keyPath: string): Promise<Keypair> {
  const buffer = await readFile(keyPath);
  let data = JSON.parse(buffer.toString());
  return Keypair.fromSecretKey(toBuffer(data));
}

export async function getLPBalance() {
  const connection = await getConnection();
  const orca = getOrca(connection);

  try {
    let userFeeAddress = await getKeyPair(
      "/Users/ottocheung/dev/solana/pub.json"
    );

    let pool = orca.getPool(OrcaPoolConfig.ETH_USDC);

    let returnVal = await pool?.getLPBalance(userFeeAddress.publicKey);
    console.log("User has ETH-USDC LP token balance of - " + returnVal);
  } catch (err) {
    console.log(err);
  }
}

export async function getLPSupply() {
  const connection = await getConnection();
  const orca = getOrca(connection);

  try {
    let pool = orca.getPool(OrcaPoolConfig.ETH_USDC);

    let returnVal = await pool?.getLPSupply();
    console.log("User has ETH-USDC LP token supply of - " + returnVal);
  } catch (err) {
    console.log(err);
  }
}

export async function getQuote() {
  const connection = await getConnection();
  const orca = getOrca(connection);

  try {
    let pool = orca.getPool(OrcaPoolConfig.ORCA_USDC);

    let tokenA = pool?.getTokenA(); // ETH
    console.log(`Token A - ${tokenA.name}`);

    let tokenB = pool?.getTokenB(); // USDC
    console.log(`Token B - ${tokenB.name}`);

    // Quote for 1 ETH to USDC
    let quote = await pool?.getQuote(tokenA, new Decimal(1), new Decimal(0.1));

    const result = {
      rate: quote.getRate(),
      impact: quote.getPriceImpact(),
      lpFees: quote.getLPFees().toNumber(),
      fees: quote.getNetworkFees().toNumber(),
      expected: quote.getExpectedOutputAmount().toNumber(),
      min: quote.getMinOutputAmount().toNumber(),
    };
    console.log(result);
  } catch (err) {
    console.log(err);
  }
}

export async function swapping() {
  const connection = await getConnection();
  const orca = getOrca(connection);

  try {
    let pool = orca.getPool(OrcaPoolConfig.ORCA_USDC);
    let owner = await getKeyPair("/Users/ottocheung/dev/solana/p1.json");

    const token = pool.getTokenB();

    const tradeValue = new Decimal(0.1);
    let quote = await pool?.getQuote(token, tradeValue, new Decimal(0.1));
    const swapPayload = await pool.swap(
      owner,
      token,
      tradeValue,
      quote.getMinOutputAmount()
    );
    // console.log(`payload - ${JSON.stringify(swapPayload)}`);
    swapPayload.execute();
    // sendAndConfirmTransaction(
    //   connection,
    //   swapPayload.transaction,
    //   swapPayload.signers
    // );
  } catch (err) {
    console.log(err);
  }
}

getQuote().then(() => {
  console.log("Complete.");
});

async function getConnection(
  url: string = "https://orca.rpcpool.com/"
): Promise<Connection> {
  if (connection) return connection;

  connection = new Connection(url, "singleGossip");
  const version = await connection.getVersion();

  console.log("Connection to cluster established:", url, version);
  return connection;
}

const toBuffer = (arr: Buffer | Uint8Array | Array<number>): Buffer => {
  if (arr instanceof Buffer) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};
