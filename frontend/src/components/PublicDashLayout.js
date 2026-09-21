import { Outlet } from 'react-router-dom'
import PublicAppbar from '../config/PublicAppbar'

const PublicDashLayout = () => {
    return (
        <>
            <PublicAppbar />
                <div className="">
                    <Outlet />
                </div>

        </>
    )
}
export default PublicDashLayout