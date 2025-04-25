import { auth } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

export const registerUser = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    // Cria o usuário com email e senha
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Após a criação, atualiza o perfil do usuário com o displayName
    await updateProfile(userCredential.user, {
      displayName: displayName,
    });

    return userCredential; // Retorna o userCredential completo, não apenas o user
  } catch (error: unknown) {
    // Verificando se o erro é uma instância de Error
    if (error instanceof Error) {
      throw new Error(error.message); // Agora é seguro acessar error.message
    }
    throw new Error("Ocorreu um erro desconhecido");
  }
};

export const loginUser = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
