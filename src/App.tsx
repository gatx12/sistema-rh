import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { auth, db } from './firebase'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

type EscalaDia = {
  dia: number
  manha: string
  noite: string
}

type DadosOnline = {
  avisos: string[]
  funcionarios: string[]
  escalaEditada: Record<string, EscalaDia>
}

const dadosPadrao: DadosOnline = {
  avisos: [],
  funcionarios: [
    'GABRIEL S',
    'JESSICA',
    'ELY',
    'JOZIANE',
    'FLAVIA',
    'GABRIEL R',
    'DIOCASSIA',
    'MARIA',
  ],
  escalaEditada: {},
}

export default function App() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [logado, setLogado] = useState(false)
  const [usuarioLogado, setUsuarioLogado] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  const [mes, setMes] = useState('Maio')
  const [pagina, setPagina] = useState('dashboard')

  const [novoAviso, setNovoAviso] = useState('')
  const [novoFuncionario, setNovoFuncionario] = useState('')

  const [dados, setDados] = useState<DadosOnline>(dadosPadrao)

  const empresaRef = doc(db, 'empresas', 'empresa-demo')

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLogado(true)
        setUsuarioLogado(user.email || '')
      } else {
        setLogado(false)
        setUsuarioLogado('')
      }

      setCarregando(false)
    })

    return () => cancelar()
  }, [])

  useEffect(() => {
    const cancelar = onSnapshot(empresaRef, async (snapshot) => {
      if (snapshot.exists()) {
        setDados({
          ...dadosPadrao,
          ...(snapshot.data() as DadosOnline),
        })
      } else {
        await setDoc(empresaRef, dadosPadrao)
      }
    })

    return () => cancelar()
  }, [])

  const salvarOnline = async (novoDado: DadosOnline) => {
    setDados(novoDado)
    await setDoc(empresaRef, novoDado, { merge: true })
  }

  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const escalaBase: EscalaDia[] = [
    { dia: 1, manha: 'GABRIEL S / JESSICA', noite: 'ELY / JOZIANE' },
    { dia: 2, manha: 'FLAVIA / GABRIEL R', noite: 'DIOCASSIA / MARIA' },
    { dia: 3, manha: 'ELY / JOZIANE', noite: 'GABRIEL S / JESSICA' },
    { dia: 4, manha: 'DIOCASSIA / MARIA', noite: 'FLAVIA / GABRIEL R' },
    { dia: 5, manha: 'GABRIEL S / JESSICA', noite: 'DIOCASSIA / MARIA' },
    { dia: 6, manha: 'FLAVIA / GABRIEL R', noite: 'ELY / JOZIANE' },
  ]

  const escala = useMemo(() => {
    return escalaBase.map((item) => {
      const chave = `${mes}-${item.dia}`
      return dados.escalaEditada[chave] || item
    })
  }, [dados.escalaEditada, mes])

  const isAdmin = usuarioLogado.includes('admin')

  const gerarEmail = () => {
    const texto = usuario.trim().toLowerCase()

    if (texto.includes('@')) {
      return texto
    }

    return `${texto}@rh.com`
  }

  const fazerLogin = async () => {
    try {
      setErro('')

      if (!usuario.trim() || !senha.trim()) {
        setErro('Digite usuário e senha.')
        return
      }

      await signInWithEmailAndPassword(auth, gerarEmail(), senha)
    } catch (error: any) {
      setErro(error.message || 'Erro ao entrar.')
    }
  }

  const criarConta = async () => {
    try {
      setErro('')

      if (!usuario.trim() || !senha.trim()) {
        setErro('Digite usuário e senha.')
        return
      }

      if (senha.length < 6) {
        setErro('A senha precisa ter no mínimo 6 caracteres.')
        return
      }

      await createUserWithEmailAndPassword(auth, gerarEmail(), senha)

      alert('Conta criada com sucesso.')
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar conta.')
    }
  }

  const sair = async () => {
    await signOut(auth)

    setUsuario('')
    setSenha('')
    setErro('')
  }

  const publicarAviso = async () => {
    if (!novoAviso.trim()) return

    await salvarOnline({
      ...dados,
      avisos: [novoAviso, ...dados.avisos],
    })

    setNovoAviso('')
  }

  const cadastrarFuncionario = async () => {
    if (!novoFuncionario.trim()) return

    await salvarOnline({
      ...dados,
      funcionarios: [
        ...dados.funcionarios,
        novoFuncionario.toUpperCase(),
      ],
    })

    setNovoFuncionario('')
  }

  const editarEscala = async (
    item: EscalaDia,
    campo: 'manha' | 'noite',
    valor: string
  ) => {
    const chave = `${mes}-${item.dia}`

    await salvarOnline({
      ...dados,
      escalaEditada: {
        ...dados.escalaEditada,
        [chave]: {
          ...item,
          [campo]: valor.toUpperCase(),
        },
      },
    })
  }

  if (carregando) {
    return (
      <div className="app">
        <h1>Carregando...</h1>
      </div>
    )
  }

  if (!logado) {
    return (
      <div className="loginContainer">
        <div className="loginBox">
          <h1>Sistema RH</h1>

          <p>Escala Operacional Online</p>

          <input
            type="text"
            placeholder="Usuário ou e-mail"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {erro && <div className="erro">{erro}</div>}

          <button onClick={fazerLogin}>Entrar</button>

          <button onClick={criarConta}>
            Criar conta
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>RH</h1>

        <p>{usuarioLogado}</p>

        <button onClick={() => setPagina('dashboard')}>
          Dashboard
        </button>

        <button onClick={() => setPagina('escala')}>
          Escala
        </button>

        <button onClick={() => setPagina('avisos')}>
          Avisos
        </button>

        <button onClick={() => setPagina('funcionarios')}>
          Funcionários
        </button>

        <button onClick={sair}>
          Sair
        </button>
      </aside>

      <main className="conteudo">
        {pagina === 'dashboard' && (
          <>
            <h1 className="titulo">
              Dashboard
            </h1>

            <div className="cards">
              <div className="card">
                <h2>{dados.funcionarios.length}</h2>
                <p>Funcionários</p>
              </div>

              <div className="card">
                <h2>{dados.avisos.length}</h2>
                <p>Avisos</p>
              </div>

              <div className="card">
                <h2>{escala.length}</h2>
                <p>Dias na escala</p>
              </div>
            </div>
          </>
        )}

        {pagina === 'escala' && (
          <>
            <h1 className="titulo">
              Escala Operacional
            </h1>

            <div className="meses">
              {meses.map((m) => (
                <button
                  key={m}
                  onClick={() => setMes(m)}
                  className={mes === m ? 'ativo' : ''}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="cards">
              {escala.map((item) => (
                <div className="card" key={item.dia}>
                  <h2>Dia {item.dia}</h2>

                  <p>🌅 Manhã</p>

                  <input
                    disabled={!isAdmin}
                    value={item.manha}
                    onChange={(e) =>
                      editarEscala(
                        item,
                        'manha',
                        e.target.value
                      )
                    }
                  />

                  <p>🌙 Noite</p>

                  <input
                    disabled={!isAdmin}
                    value={item.noite}
                    onChange={(e) =>
                      editarEscala(
                        item,
                        'noite',
                        e.target.value
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {pagina === 'avisos' && (
          <>
            <h1 className="titulo">
              Avisos
            </h1>

            {isAdmin && (
              <div className="caixa">
                <textarea
                  placeholder="Digite um aviso"
                  value={novoAviso}
                  onChange={(e) =>
                    setNovoAviso(e.target.value)
                  }
                />

                <button onClick={publicarAviso}>
                  Publicar aviso
                </button>
              </div>
            )}

            <div className="cards">
              {dados.avisos.map((aviso, index) => (
                <div className="card" key={index}>
                  <p>{aviso}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {pagina === 'funcionarios' && (
          <>
            <h1 className="titulo">
              Funcionários
            </h1>

            {isAdmin && (
              <div className="caixa">
                <input
                  placeholder="Nome do funcionário"
                  value={novoFuncionario}
                  onChange={(e) =>
                    setNovoFuncionario(
                      e.target.value
                    )
                  }
                />

                <button
                  onClick={cadastrarFuncionario}
                >
                  Cadastrar funcionário
                </button>
              </div>
            )}

            <div className="cards">
              {dados.funcionarios.map((nome) => (
                <div className="card" key={nome}>
                  <h2>{nome}</h2>

                  <p>Ativo</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}