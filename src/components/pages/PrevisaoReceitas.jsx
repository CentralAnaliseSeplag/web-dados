
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'

import './CatalogoDados.css'
import './PrevisaoReceitas.css'

const BUCKET = 'relatorios-internos'
const ARQUIVO = 'relatorio_benchmark.html'

export default function PrevisaoReceitas() {
  const [html, setHtml] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false

    async function carregarRelatorio() {
      setCarregando(true)
      setHtml('')
      setErro('')

      try {
        const { data: sessao, error: erroSessao } =
          await supabase.auth.getSession()

        if (
          erroSessao ||
          !sessao?.session?.access_token
        ) {
          throw new Error(
            'Sua sessão expirou. Entre novamente.'
          )
        }

        const { data: arquivo, error: erroDownload } =
          await supabase.storage
            .from(BUCKET)
            .download(ARQUIVO)

        if (erroDownload) {
          throw new Error(
            'Não foi possível acessar o relatório. Verifique suas permissões.'
          )
        }

        if (!arquivo) {
          throw new Error(
            'O arquivo do relatório não foi encontrado.'
          )
        }

        const documento = await arquivo.text()

        if (!documento.trim()) {
          throw new Error('O relatório está vazio.')
        }

        if (!cancelado) {
          setHtml(documento)
        }
      } catch (falha) {
        if (!cancelado) {
          setErro(
            falha?.message ||
            'Não foi possível carregar o relatório.'
          )
        }
      } finally {
        if (!cancelado) {
          setCarregando(false)
        }
      }
    }

    carregarRelatorio()

    return () => {
      cancelado = true
    }
  }, [tentativa])

  return (
    <main className="catalogo-dados previsao-receitas">
      <Link
        to="/Dados"
        className="previsao-receitas__voltar"
      >
        ← Voltar para Dados
      </Link>

      <header className="catalogo-dados__cabecalho previsao-receitas__cabecalho">
        <div>
          <h1>Previsão de Receitas Municipais</h1>
          <p>
            Relatório de previsão de receitas dos
            municípios de Pernambuco.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setTentativa((valor) => valor + 1)}
          disabled={carregando}
          className="previsao-receitas__botao"
        >
          Atualizar relatório
        </button>
      </header>

      {carregando && (
        <section
          className="previsao-receitas__status"
          role="status"
        >
          Verificando acesso e carregando o relatório...
        </section>
      )}

      {erro && (
        <section
          className="previsao-receitas__status previsao-receitas__status--erro"
          role="alert"
        >
          <strong>Não foi possível abrir o relatório.</strong>
          <p>{erro}</p>
          <button
            type="button"
            onClick={() => setTentativa((valor) => valor + 1)}
          >
            Tentar novamente
          </button>
        </section>
      )}

      {!carregando && !erro && html && (
        <div className="previsao-receitas__moldura">
          <iframe
            title="Relatório de Previsão de Receitas Municipais de Pernambuco"
            srcDoc={html}
            sandbox="allow-scripts allow-downloads"
            referrerPolicy="no-referrer"
            className="previsao-receitas__iframe"
          />
        </div>
      )}
    </main>
  )
}
