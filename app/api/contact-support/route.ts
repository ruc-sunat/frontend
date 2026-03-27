import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Verificar que el usuario esté autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario sea Pro (plan_id = 3)
    const { data: userData } = await supabase
      .from('users')
      .select('plan_id')
      .eq('id', user.id)
      .single()

    if (userData?.plan_id !== 3) {
      return NextResponse.json(
        { error: 'Solo usuarios Pro pueden contactar a soporte' },
        { status: 403 }
      )
    }

    // Obtener datos del formulario
    const { email, subject, message } = await req.json()

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Enviar correo a soporte y copiar al usuario
    const emailResult = await resend.emails.send({
      from: 'soporte@consultaperuapi.com',
      to: 'soporte@consultaperuapi.com',
      replyTo: email,
      subject: `[Contacto Usuario Pro] ${subject}`,
      html: `
        <h2>${subject}</h2>
        <p><strong>De:</strong> ${email}</p>
        <p><strong>Usuario ID:</strong> ${user.id}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    if (emailResult.error) {
      console.error('Error al enviar correo:', emailResult.error)
      return NextResponse.json(
        { error: 'Error al enviar el mensaje. Por favor intenta más tarde.' },
        { status: 500 }
      )
    }

    // Enviar copia de confirmación al usuario
    await resend.emails.send({
      from: 'soporte@consultaperuapi.com',
      to: email,
      subject: 'Confirmación: Mensaje recibido',
      html: `
        <p>Hola,</p>
        <p>Hemos recibido tu mensaje. Nuestro equipo de soporte se pondrá en contacto pronto.</p>
        <hr />
        <p><strong>Asunto:</strong> ${subject}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado exitosamente. Nos comunicaremos pronto.',
    })
  } catch (error) {
    console.error('Error en contact-support:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
