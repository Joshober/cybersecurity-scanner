import { db } from "../../lib/db";

export async function GET(request) {
  const id = request.nextUrl.searchParams.get("id");
  await db.query(`SELECT * FROM users WHERE id = '${id}'`);
}
