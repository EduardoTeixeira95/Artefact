"use client";

/** Error boundary das páginas: captura falhas inesperadas de renderização. */
export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="estado estado--erro" role="alert">
      <h1>Algo deu errado</h1>
      <p>Ocorreu um erro inesperado ao carregar esta página.</p>
      <button type="button" className="botao" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
