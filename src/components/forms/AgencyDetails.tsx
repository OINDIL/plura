"use client";
import { useToast } from "@/hooks/use-toast";
import { Agency } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { AlertDialog } from "../ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

type Props = {
  data?: Partial<Agency>;
};

const AgencyDetails = ({ data }: Props) => {
  const { toast } = useToast();
  const router = useRouter();

  const [deletingAgency, setDeletingAgency] = useState(false);

  return (
    <div>
      <AlertDialog>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Agency Information</CardTitle>
            <CardDescription>
              Lets create an agency for you business. You can edit agency
              settings later from the agency settings tab.
            </CardDescription>
          </CardHeader>

          <CardContent></CardContent>
        </Card>
      </AlertDialog>
    </div>
  );
};

export default AgencyDetails;
