import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Dọn DOM sau mỗi test để tránh rò rỉ state giữa các test case.
afterEach(() => {
  cleanup()
})
