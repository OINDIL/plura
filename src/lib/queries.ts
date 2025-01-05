"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";

import { db } from "./db";
import { redirect } from "next/navigation";
import { Role, User } from "@prisma/client";

export const getUserDetails = async () => {
  const user = await currentUser();
  if (!user) return;

  const userData = await db.user.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
    include: {
      Agency: {
        include: {
          SidebarOption: true,
          SubAccount: {
            include: {
              SidebarOption: true,
            },
          },
        },
      },
      Permissions: true,
    },
  });

  return userData;
};

export const saveActivityLogNotification = async ({
  agencyId,
  description,
  subaccounId,
}: {
  agencyId?: string;
  description: string;
  subaccounId?: string;
}) => {
  const authUser = await currentUser();
  let userData;
  if (!authUser) {
    const response = await db.user.findFirst({
      where: { Agency: { SubAccount: { some: { id: subaccounId } } } },
    });
    if (response) {
      userData = response;
    }
  } else {
    userData = await db.user.findUnique({
      where: {
        email: authUser?.emailAddresses[0].emailAddress,
      },
    });
  }
  if (!userData) {
    console.log("No user found");
    return;
  }

  let foundAgencyId = agencyId;

  if (!foundAgencyId) {
    if (!subaccounId) {
      throw new Error(
        "You have to provide at least an agencyId or a subaccounId"
      );
    }
    const response = await db.subAccount.findUnique({
      where: { id: subaccounId },
    });
    if (response) {
      foundAgencyId = response.agencyId;
    }
  }

  if (subaccounId) {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
        SubAccount: {
          connect: {
            id: subaccounId,
          },
        },
      },
    });
  } else {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
      },
    });
  }
};

const createTeamUser = async (agencyId: string, user: User) => {
  if (user.role === "AGENCY_OWNER") return null;

  const response = await db.user.create({
    data: { ...user },
  });

  return response;
};

export const verifyAndAcceptInvitation = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const invitationsExists = await db.invitation.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
      status: "PENDING",
    },
  });

  if (invitationsExists) {
    const userDetails = await createTeamUser(invitationsExists.agencyId, {
      email: invitationsExists.email,
      agencyId: invitationsExists.agencyId,
      role: invitationsExists.role,
      name: `${user.firstName} ${user.lastName}`,
      avatarUrl: user.imageUrl,
      id: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await saveActivityLogNotification({
      agencyId: invitationsExists?.agencyId,
      description: "Invitation accepted",
      subaccounId: undefined,
    });

    if (userDetails) {
      const client = await clerkClient();

      await client.users.updateUserMetadata(user.id, {
        privateMetadata: {
          role: userDetails.role || "SUBACCOUNT_USER",
        },
      });

      await db.invitation.delete({
        where: { email: userDetails.email },
      });

      return userDetails.agencyId;
    } else return null;
  } else {
    const agency = await db.user.findUnique({
      where: {
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return agency ? agency.agencyId : null;
  }
};
