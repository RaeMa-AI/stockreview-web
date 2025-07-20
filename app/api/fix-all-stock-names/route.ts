import { NextResponse } from "next/server";
import { fixSpecificUsersStockNames } from "@/app/actions";

export async function POST() {
  const result = await fixSpecificUsersStockNames();
  return NextResponse.json({ message: result });
} 