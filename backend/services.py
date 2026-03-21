# Email, PDF and Notification Services for COMEP
import os
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import io

# Email
import resend

# PDF
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

logger = logging.getLogger(__name__)

# ======================== EMAIL SERVICE ========================

RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
COMEP_EMAIL = os.environ.get('COMEP_EMAIL', 'protocolocomep@pereiro.ce.gov.br')

def init_resend():
    if RESEND_API_KEY:
        resend.api_key = RESEND_API_KEY
        return True
    return False

async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """Send email using Resend API"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email send")
        return {"status": "skipped", "message": "Email service not configured"}
    
    try:
        resend.api_key = RESEND_API_KEY
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "reply_to": COMEP_EMAIL
        }
        
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}")
        return {"status": "success", "email_id": email.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return {"status": "error", "message": str(e)}

def get_email_template(title: str, content: str, footer_text: str = None) -> str:
    """Generate HTML email template with COMEP branding"""
    footer = footer_text or "Conselho Municipal de Educação de Pereiro - COMEP"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f8fafc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #0F766E; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">COMEP</h1>
                                <p style="color: #ccfbf1; margin: 5px 0 0 0; font-size: 14px;">Conselho Municipal de Educação de Pereiro</p>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 20px;">{title}</h2>
                                <div style="color: #475569; font-size: 16px; line-height: 1.6;">
                                    {content}
                                </div>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f1f5f9; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
                                <p style="color: #64748b; margin: 0; font-size: 12px;">
                                    {footer}<br>
                                    Email: {COMEP_EMAIL}
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

def get_password_recovery_email(nome: str, token: str, base_url: str) -> str:
    """Generate password recovery email content"""
    reset_link = f"{base_url}/redefinir-senha?token={token}"
    content = f"""
        <p>Olá, <strong>{nome}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no sistema COMEP.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #0F766E; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Redefinir Senha
            </a>
        </p>
        <p style="color: #94a3b8; font-size: 14px;">
            Este link é válido por 2 horas. Se você não solicitou a recuperação de senha, ignore este email.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
            Ou copie e cole este link no navegador:<br>
            <span style="word-break: break-all;">{reset_link}</span>
        </p>
    """
    return get_email_template("Recuperação de Senha", content)

def get_escola_approved_email(nome_escola: str, codigo_censo: str, senha_inicial: str) -> str:
    """Generate school approval notification email"""
    content = f"""
        <p>A escola <strong>{nome_escola}</strong> foi aprovada no sistema COMEP!</p>
        <p>Segue abaixo os dados de acesso:</p>
        <table style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; width: 100%; margin: 20px 0;">
            <tr>
                <td style="padding: 10px 0;">
                    <strong>Código de Censo:</strong> {codigo_censo}
                </td>
            </tr>
            <tr>
                <td style="padding: 10px 0;">
                    <strong>Senha Inicial:</strong> {senha_inicial}
                </td>
            </tr>
        </table>
        <p style="color: #ef4444; font-size: 14px;">
            <strong>Importante:</strong> Por segurança, recomendamos que você altere a senha no primeiro acesso.
        </p>
        <p>Acesse o sistema em: <a href="https://rede-educacao.preview.emergentagent.com" style="color: #0F766E;">Sistema COMEP</a></p>
    """
    return get_email_template("Cadastro Aprovado!", content)

def get_escola_rejected_email(nome_escola: str, motivo: str) -> str:
    """Generate school rejection notification email"""
    content = f"""
        <p>Infelizmente, a solicitação de cadastro da escola <strong>{nome_escola}</strong> não foi aprovada.</p>
        <p><strong>Motivo:</strong></p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">{motivo}</p>
        </div>
        <p>Se você tiver dúvidas ou quiser mais informações, entre em contato conosco pelo email {COMEP_EMAIL}.</p>
    """
    return get_email_template("Solicitação de Cadastro", content)

def get_update_reminder_email(nome_escola: str, dias_sem_atualizar: int) -> str:
    """Generate update reminder notification email"""
    content = f"""
        <p>Prezado(a) Gestor(a) da <strong>{nome_escola}</strong>,</p>
        <p>Identificamos que os dados da sua escola no sistema COMEP não são atualizados há <strong>{dias_sem_atualizar} dias</strong>.</p>
        <p>De acordo com as diretrizes do Conselho Municipal de Educação, as escolas devem manter seus dados atualizados, especialmente em casos de:</p>
        <ul style="color: #475569;">
            <li>Mudança no quadro administrativo (diretor(a) e secretário(a))</li>
            <li>Alterações no corpo docente</li>
            <li>Atualização de dados cadastrais</li>
        </ul>
        <p style="text-align: center; margin: 30px 0;">
            <a href="https://rede-educacao.preview.emergentagent.com" style="background-color: #0F766E; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Atualizar Dados
            </a>
        </p>
        <p style="color: #f59e0b; font-size: 14px;">
            <strong>Atenção:</strong> Escolas com dados desatualizados podem ter sua situação alterada para "Em Análise".
        </p>
    """
    return get_email_template("Lembrete de Atualização de Dados", content)

def get_notification_summary_email(notifications: list) -> str:
    """Generate daily summary email for admin"""
    items = ""
    for notif in notifications:
        items += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{notif['escola']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{notif['dias']} dias</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{notif['email_enviado']}</td>
        </tr>
        """
    
    content = f"""
        <p>Segue o resumo das escolas com dados desatualizados:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
                <tr style="background-color: #f1f5f9;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Escola</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Dias sem Atualizar</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Notificação</th>
                </tr>
            </thead>
            <tbody>
                {items}
            </tbody>
        </table>
        <p>Total de escolas notificadas: <strong>{len(notifications)}</strong></p>
    """
    return get_email_template("Resumo de Notificações - Escolas Desatualizadas", content)


# ======================== PDF SERVICE ========================

def generate_escola_report_pdf(escola: dict, docentes: list, quadro_admin: list) -> bytes:
    """Generate PDF report for a school"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='TitleCOMEP', fontSize=20, alignment=TA_CENTER, spaceAfter=20, textColor=colors.HexColor('#0F766E'), fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='SubtitleCOMEP', fontSize=12, alignment=TA_CENTER, spaceAfter=30, textColor=colors.HexColor('#64748b')))
    styles.add(ParagraphStyle(name='SectionTitle', fontSize=14, spaceBefore=20, spaceAfter=10, textColor=colors.HexColor('#0f172a'), fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='BodyCOMEP', fontSize=10, alignment=TA_JUSTIFY, spaceAfter=10, textColor=colors.HexColor('#334155')))
    
    story = []
    
    # Header
    story.append(Paragraph("COMEP - Conselho Municipal de Educação de Pereiro", styles['TitleCOMEP']))
    story.append(Paragraph("Relatório de Escola", styles['SubtitleCOMEP']))
    
    # School Info
    story.append(Paragraph("Dados da Escola", styles['SectionTitle']))
    
    escola_data = [
        ['Nome:', escola.get('nome', '-')],
        ['Código de Censo:', escola.get('codigo_censo', '-')],
        ['Endereço:', escola.get('endereco', '-')],
        ['Telefone:', escola.get('telefone', '-') or '-'],
        ['Email:', escola.get('email', '-') or '-'],
        ['Situação:', escola.get('situacao', '-').title()],
        ['Modalidades:', ', '.join(escola.get('modalidades', [])) or '-'],
        ['Última Atualização:', escola.get('data_atualizacao', '-')[:10] if escola.get('data_atualizacao') else '-'],
    ]
    
    table = Table(escola_data, colWidths=[4*cm, 12*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(table)
    
    # Quadro Administrativo
    story.append(Spacer(1, 20))
    story.append(Paragraph(f"Quadro Administrativo ({len(quadro_admin)} membros)", styles['SectionTitle']))
    
    if quadro_admin:
        quadro_data = [['Nome', 'Cargo', 'Formação', 'Email']]
        for m in quadro_admin:
            quadro_data.append([
                m.get('nome', '-'),
                m.get('cargo', '-'),
                m.get('formacao', '-'),
                m.get('email', '-') or '-'
            ])
        
        table = Table(quadro_data, colWidths=[5*cm, 3*cm, 4*cm, 4*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F766E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ]))
        story.append(table)
    else:
        story.append(Paragraph("Nenhum membro cadastrado.", styles['BodyCOMEP']))
    
    # Corpo Docente
    story.append(Spacer(1, 20))
    story.append(Paragraph(f"Corpo Docente ({len(docentes)} docentes)", styles['SectionTitle']))
    
    if docentes:
        docente_data = [['Nome', 'Formação', 'Disciplinas', 'Vínculo', 'CH']]
        for d in docentes:
            docente_data.append([
                d.get('nome', '-'),
                d.get('formacao', '-'),
                ', '.join(d.get('disciplinas', []))[:30] or '-',
                d.get('vinculo', '-'),
                str(d.get('carga_horaria', '-')) + 'h'
            ])
        
        table = Table(docente_data, colWidths=[4.5*cm, 3*cm, 4*cm, 2.5*cm, 2*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F766E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (-1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ]))
        story.append(table)
    else:
        story.append(Paragraph("Nenhum docente cadastrado.", styles['BodyCOMEP']))
    
    # Footer
    story.append(Spacer(1, 40))
    story.append(Paragraph(f"Relatório gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}", styles['SubtitleCOMEP']))
    story.append(Paragraph("COMEP - Conselho Municipal de Educação de Pereiro - CE", styles['SubtitleCOMEP']))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_escolas_summary_pdf(escolas: list, stats: dict) -> bytes:
    """Generate PDF summary report of all schools"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='TitleCOMEP', fontSize=20, alignment=TA_CENTER, spaceAfter=20, textColor=colors.HexColor('#0F766E'), fontName='Helvetica-Bold'))
    styles.add(ParagraphStyle(name='SubtitleCOMEP', fontSize=12, alignment=TA_CENTER, spaceAfter=30, textColor=colors.HexColor('#64748b')))
    styles.add(ParagraphStyle(name='SectionTitle', fontSize=14, spaceBefore=20, spaceAfter=10, textColor=colors.HexColor('#0f172a'), fontName='Helvetica-Bold'))
    
    story = []
    
    # Header
    story.append(Paragraph("COMEP - Conselho Municipal de Educação de Pereiro", styles['TitleCOMEP']))
    story.append(Paragraph("Relatório Geral das Escolas", styles['SubtitleCOMEP']))
    
    # Stats
    story.append(Paragraph("Resumo Estatístico", styles['SectionTitle']))
    
    stats_data = [
        ['Indicador', 'Quantidade'],
        ['Total de Escolas', str(stats.get('total_escolas', 0))],
        ['Escolas Ativas', str(stats.get('escolas_ativas', 0))],
        ['Escolas em Análise', str(stats.get('escolas_em_analise', 0))],
        ['Total de Docentes', str(stats.get('total_docentes', 0))],
        ['Alunos (estimativa)', str(stats.get('total_alunos_estimado', 0))],
        ['Solicitações Pendentes', str(stats.get('solicitacoes_pendentes', 0))],
    ]
    
    table = Table(stats_data, colWidths=[10*cm, 6*cm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F766E')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
    ]))
    story.append(table)
    
    # Schools List
    story.append(Spacer(1, 20))
    story.append(Paragraph("Lista de Escolas", styles['SectionTitle']))
    
    if escolas:
        escola_data = [['Código', 'Nome', 'Situação', 'Última Atualização']]
        for e in escolas:
            situacao_map = {'ativa': 'Ativa', 'inativa': 'Inativa', 'em_analise': 'Em Análise'}
            escola_data.append([
                e.get('codigo_censo', '-'),
                e.get('nome', '-')[:40],
                situacao_map.get(e.get('situacao', ''), '-'),
                e.get('data_atualizacao', '-')[:10] if e.get('data_atualizacao') else '-'
            ])
        
        table = Table(escola_data, colWidths=[3*cm, 7*cm, 3*cm, 3*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F766E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ]))
        story.append(table)
    
    # Footer
    story.append(Spacer(1, 40))
    story.append(Paragraph(f"Relatório gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}", styles['SubtitleCOMEP']))
    story.append(Paragraph("COMEP - Conselho Municipal de Educação de Pereiro - CE", styles['SubtitleCOMEP']))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
