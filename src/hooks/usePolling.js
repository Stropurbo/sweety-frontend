import { useEffect, useRef, useCallback } from 'react'

const usePolling = (callback, interval = 15000) => {
	const savedCallback = useRef(callback)
	useEffect(() => { savedCallback.current = callback }, [callback])

	useEffect(() => {
		const id = setInterval(() => savedCallback.current(), interval)
		return () => clearInterval(id)
	}, [interval])
}

export default usePolling
