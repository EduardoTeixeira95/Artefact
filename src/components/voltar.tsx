import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function Voltar() {
  return (
    <Link href="/" className="voltar">
      <ArrowLeft size={16} aria-hidden />
      Voltar para a lista
    </Link>
  );
}
