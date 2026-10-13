'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return redirect('/login?error=' + error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const data = {
    email,
    password,
    options: {
      data: {
        name,
      }
    }
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    return redirect('/signup?error=' + error.message)
  }

  // Fallback: 트리거가 모종의 이유로 동작하지 않았을 경우를 대비해 직접 삽입 시도
  // 이 코드는 이메일 인증이 꺼져있어 즉시 로그인(세션 발급)이 된 상태에서만 성공합니다.
  if (authData?.user) {
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      name: name,
      role: 'user',
    }, { onConflict: 'id' }).select()
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
