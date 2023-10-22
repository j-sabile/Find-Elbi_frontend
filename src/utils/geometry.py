from decimal import *
import re

def getLatLng(s):
    match = re.search(r"lat: ([-+]?\d+\.\d+), lng: ([-+]?\d+\.\d+)", s)
    if match: return [Decimal(match.group(1)), Decimal(match.group(2))]
    latlng =  s.split(",")
    return Decimal(latlng[0].strip()), Decimal(latlng[1].strip())

def computeDistance(x1, y1, x2, y2):
    return [x2-x1, y2-y1]

def computePoint(ax, ay, dx, dy, percent):
    temp = []
    for j in percent.split():
        i = Decimal(j)
        temp.append([str(ax+dx*i), str(ay+dy*i)]) 
    return temp

def computeMany(ax,ay, bx,by, cx,cy, dx,dy, percent):
    dx1, dy1 = computeDistance(ax, ay, bx, by)
    temp1 = computePoint(ax, ay, dx1, dy1, percent)
    dx2, dy2 = computeDistance(dx, dy, cx, cy)
    temp2 = computePoint(dx, dy, dx2, dy2, percent)
    return temp1, temp2

print("HELLO WORLD\n")
print("[1] Line")
print("[2] Quadrilateral")
choice = input("Choice: ")

if (choice == "1"):
    ax, ay = getLatLng(input("a: "))
    bx, by = getLatLng(input("b: "))
    c = (input("c: "))

    dx, dy = computeDistance(ax,ay,bx,by)

    result = computePoint(ax, ay, dx, dy, c)
    print(result)
else:
    ax, ay = getLatLng(input("a: "))
    bx, by = getLatLng(input("b: "))
    cx, cy = getLatLng(input("c: "))
    dx, dy = getLatLng(input("d: "))
    c = (input("c: "))
    result = computeMany(ax, ay, bx, by, cx, cy, dx, dy, c)
    print()
    for i in range(len(result[0])):
        print(result[0][i][0]+", "+result[0][i][1])
        print(result[1][i][0]+", "+result[1][i][1])
        print()
        


