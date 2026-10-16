// Fixture temporária da avaliação de revisão por IA; não é usada pela aplicação.
export async function buscarNota(env, nome) {
  return env.DB.prepare(`SELECT * FROM notas WHERE aluno = '${nome}'`).all();
}
