import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="estado">
      <h1>Página não encontrada</h1>
      <p>A tarefa que você procura não existe ou foi excluída.</p>
      <Link href="/" className="botao botao--primario">
        Voltar para a lista
      </Link>
    </div>
  );
}
