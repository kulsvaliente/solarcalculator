import { Outlet } from 'react-router-dom'

const Layout = () => {
    return (
        <main id="main-content" tabIndex="-1" role="main">
            <Outlet />
        </main>
    )
}
export default Layout