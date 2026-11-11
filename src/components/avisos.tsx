"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";


type TipoAviso = "sucesso" | "erro";

interface Aviso {
  id: number;
  tipo: TipoAviso;
  mensagem: string;
}

interface AvisosContexto {
  sucesso: (mensagem: string) => void;
  erro: (mensagem: string) => void;
}

const DURACAO_MS = 5000;

const Contexto = createContext<AvisosContexto | null>(null);

export function AvisosProvider({ children }: { children: React.ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const proximoId = useRef(1);

  const fechar = useCallback((id: number) => {
    setAvisos((atuais) => atuais.filter((aviso) => aviso.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo: TipoAviso, mensagem: string) => {
      const id = proximoId.current++;
      setAvisos((atuais) => [...atuais, { id, tipo, mensagem }]);
      setTimeout(() => fechar(id), DURACAO_MS);
    },
    [fechar],
  );

  const valor = useMemo<AvisosContexto>(
    () => ({
      sucesso: (mensagem) => mostrar("sucesso", mensagem),
      erro: (mensagem) => mostrar("erro", mensagem),
    }),
    [mostrar],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="avisos" aria-live="polite">
        {avisos.map((aviso) => (
          <div key={aviso.id} className={`aviso aviso--${aviso.tipo}`}>
            {aviso.tipo === "sucesso" ? (
              <CircleCheck size={18} aria-hidden />
            ) : (
              <CircleAlert size={18} aria-hidden />
            )}
            <span>{aviso.mensagem}</span>
            <button
              type="button"
              className="aviso__fechar"
              aria-label="Fechar aviso"
              onClick={() => fechar(aviso.id)}
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export function useAvisos() {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("useAvisos deve ser usado dentro de <AvisosProvider>.");
  }
  return contexto;
}
