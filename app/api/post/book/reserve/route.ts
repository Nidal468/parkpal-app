import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/db/mongoose";
import Booking from "@/model/booking";
import { Spaces } from "@/model/spaces";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { IUser, User } from "@/model/user";
import { stripe } from "@/hooks/stripe";
import { server } from "@/url";

export async function POST(req: NextRequest) {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.user.email) {
        return NextResponse.json('Unauthorized', { status: 401 });
    };

    if (!stripe) return NextResponse.json('please try again later', { status: 500 });
    try {
        await connectMongo();

        const body: {
            id: string;
            customer: {
                name: string;
                email: string;
                phone: string;
            };
            metadata: {
                vehicle: string;
                vehicleType: string;
                bookingPeriod: string;
            };
            amount: number;
            currency: string;
            description: string;
        } = await req.json();

        const {
            id,
            customer,
            metadata,
            amount,
            currency,
            description
        } = body;

        if (
            !id ||
            !customer?.name ||
            !customer?.email ||
            !metadata?.vehicle ||
            !metadata?.bookingPeriod ||
            !amount ||
            !description
        ) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Check if the space is available
        const space = await Spaces.findById(id);

        if (!space) {
            return NextResponse.json({ message: "Space not found" }, { status: 404 });
        }

        if (space.is_available === false) {
            return NextResponse.json({ message: "Space is already reserved" }, { status: 409 });
        }

        // Mark space as unavailable
        await Spaces.findByIdAndUpdate(id, { is_available: false });

        // Create booking
        const booking = await Booking.create({
            customer,
            metadata,
            amount,
            currency,
            description
        });
        const user: IUser | null = await User.findById(session.user.id);
        console.log(user)
        if (user && booking) {
            if (!user.stripeCustomerId) {
                const customer = await stripe.customers.create({
                    email: session.user.email,
                });
                user.stripeCustomerId = customer.id;
                await user.save();
            }

            const checkout = await stripe.checkout.sessions.create({
                mode: 'payment',
                payment_method_types: ['card', 'us_bank_account'],
                line_items: [
                    {
                        price: booking.priceId,
                        quantity: 1,
                    },
                ],
                customer: user.stripeCustomerId,
                success_url: `${server}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${server}/cancelled`,
                metadata: {
                    userId: user.id,
                    productId: booking.id
                }
            });

            return NextResponse.json(checkout.url, { status: 200 });
        } else {
            return NextResponse.json('please try again later', { status: 500 });
        }
    } catch (error) {
        console.error("Error creating booking:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
