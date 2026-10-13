import { login } from './actions'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams;
  
  return (
    <div className="flex justify-center items-center py-20 bg-gray-50 min-h-[70vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-center mb-8 text-black">로그인</h1>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full border rounded-md px-3 py-2 text-black"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full border rounded-md px-3 py-2 text-black"
            />
          </div>
          <button
            formAction={login}
            className="w-full bg-black text-white font-semibold py-3 rounded-md hover:bg-gray-800 transition mt-4"
          >
            로그인
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-black font-bold hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}
