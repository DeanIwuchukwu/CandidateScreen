"use server";

import { redirect } from "next/navigation";
import { submitContactAction as saveContact } from "@/lib/recruiter/actions";

export async function submitContactForm(formData: FormData) {
  await saveContact(formData);
  redirect("/contact?sent=1");
}
