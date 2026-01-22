import { atom } from "jotai";

export type FormStateAtomValue = "idle" | "loading";

export const formStateAtom = atom<FormStateAtomValue>("idle")

type FormError = {
  message: string
  isActive: boolean
} | null

const formErrorBaseAtom = atom<FormError>(null)

export const formErrorAtom = atom(
  (get) => get(formErrorBaseAtom),
  (get, set, update: FormError) => {
    set(formErrorBaseAtom, update)
  }
)

formErrorAtom.onMount = (setAtom) => {
  return () => {
    setAtom(null)
  }
}

const formEmailBaseAtom = atom<string>("")

export const formEmailAtom = atom(
  (get) => get(formEmailBaseAtom),
  (get, set, update: string) => {
    set(formEmailBaseAtom, update)
  }
)

formEmailAtom.onMount = (setAtom) => {
  return () => {
    setAtom("")
  }
}
