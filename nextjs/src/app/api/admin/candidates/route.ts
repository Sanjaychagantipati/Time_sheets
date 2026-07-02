import { NextRequest } from "next/server";
import { POST as createEmployee } from "../employees/route";

export async function POST(req: NextRequest) {
  return await createEmployee(req);
}
