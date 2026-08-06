import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await decrypt(token);

    const headerBarbershopId = request.headers.get("x-barbershop-id");
    const barbershopId = session?.barbershopId || headerBarbershopId;

    if (!barbershopId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const brandPrimaryColor = formData.get("brandPrimaryColor") as string | null;
    const brandSecondaryColor = formData.get("brandSecondaryColor") as string | null;
    const brandAccentColor = formData.get("brandAccentColor") as string | null;

    let logoUrl: string | undefined = undefined;

    if (file && file.size > 0) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "El archivo subido debe ser una imagen" }, { status: 400 });
      }

      // Limitar tamaño a 3MB para base64 óptimo en DB
      if (file.size > 3 * 1024 * 1024) {
        return NextResponse.json({ error: "La imagen no debe superar los 3MB" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || "image/png";

      // Guardar como Base64 Data URL en la base de datos
      logoUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
    }

    const updateData: any = {};
    if (logoUrl) updateData.logoUrl = logoUrl;
    if (brandPrimaryColor) updateData.brandPrimaryColor = brandPrimaryColor;
    if (brandSecondaryColor) updateData.brandSecondaryColor = brandSecondaryColor;
    if (brandAccentColor) updateData.brandAccentColor = brandAccentColor;

    const updated = await prisma.barbershop.update({
      where: { id: barbershopId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      logoUrl: updated.logoUrl,
      brandPrimaryColor: updated.brandPrimaryColor,
      brandSecondaryColor: updated.brandSecondaryColor,
      brandAccentColor: updated.brandAccentColor,
    });
  } catch (error) {
    console.error("[Barbershop Logo Upload Error]", error);
    return NextResponse.json({ error: "Error procesando el logo" }, { status: 500 });
  }
}
