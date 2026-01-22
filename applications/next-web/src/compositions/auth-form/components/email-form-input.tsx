"use client"

import { Input } from "@/components/input"
import { formStateAtom, formErrorAtom } from "../atoms/form-state"
import { useAtomValue, useSetAtom } from "jotai"
import { cn } from "@/utils/cn"
import { useRef, useEffect } from "react"

export const EmailFormInput = () => {
  const formState = useAtomValue(formStateAtom)
  const error = useAtomValue(formErrorAtom)
  const setError = useSetAtom(formErrorAtom)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }, [])

  const handleChange = () => {
    if (error?.isActive) {
      setError({ ...error, isActive: false })
    }
  }

  return (
    <Input
      ref={inputRef}
      disabled={formState === 'loading'}
      type="email"
      placeholder="johndoe+keeper@example.com"
      className={cn(error?.isActive && "border-red-500 dark:border-red-400")}
      onChange={handleChange}
    />
  )
}
