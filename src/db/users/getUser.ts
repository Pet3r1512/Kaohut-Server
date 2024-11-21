import prisma from "../Prisma";

export default async function getUser(email: string) {
    prisma.$connect()
    const user = await prisma.user.findFirst({
        where: {
            email: email
        }
    })
    prisma.$disconnect()
    if (user) {
        return true
    }
    return false
}