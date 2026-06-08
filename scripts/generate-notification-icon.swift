import AppKit

let size = NSSize(width: 96, height: 96)
let image = NSImage(size: size)

image.lockFocus()
NSColor.clear.setFill()
NSRect(origin: .zero, size: size).fill()
NSColor.white.setStroke()

func drawArc(radius: CGFloat, start: CGFloat, end: CGFloat, width: CGFloat) {
    let path = NSBezierPath()
    path.lineWidth = width
    path.lineCapStyle = .round
    path.appendArc(
        withCenter: NSPoint(x: 48, y: 48),
        radius: radius,
        startAngle: start,
        endAngle: end
    )
    path.stroke()
}

drawArc(radius: 25, start: 42, end: 318, width: 12)
drawArc(radius: 38, start: 78, end: 142, width: 4)
drawArc(radius: 38, start: 218, end: 282, width: 4)

let center = NSBezierPath(ovalIn: NSRect(x: 42, y: 42, width: 12, height: 12))
NSColor.white.setFill()
center.fill()

image.unlockFocus()

guard
    let tiff = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let png = bitmap.representation(using: .png, properties: [:])
else {
    fatalError("Could not render notification icon")
}

let output = URL(fileURLWithPath: CommandLine.arguments[1])
try png.write(to: output)
