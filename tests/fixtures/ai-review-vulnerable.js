// Fixture da avaliação de revisão por IA; não é importada pela aplicação.
export async function buscarNota(env, nome) {
  return env.DB.prepare("SELECT * FROM notas WHERE aluno = ?").bind(nome).all();
}
