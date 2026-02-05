import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ProductModal from '../components/ProductModal'
import { useAuthStore } from '../store/authStore'

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const productId = id === 'new' ? undefined : parseInt(id || '0')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const handleClose = () => {
    navigate('/products')
  }

  const handleSuccess = () => {
    navigate('/products')
  }

  return (
    <ProductModal
      isOpen={true}
      onClose={handleClose}
      productId={productId}
      onSuccess={handleSuccess}
    />
  )
}
