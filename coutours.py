import cv2 as cv
import numpy as np
import sys
img_url = sys.argv[1]
post_rect = sys.argv[2]
post_face = sys.argv[3]
post_rect = (post_rect.split(','))
print(post_rect)
# post_face = 'right'
# temp = ['688.44140625', '508.37890625', '868.9921264648438', '808.18359375']

# print(cv.__version__)
def auto_canny(image, sigma=0.85):
    # compute the median of the single channel pixel intensities
    v = np.median(image)

    # construct two thresholds using the median
    lower = int(max(0, (1.0 - sigma) * v))
    upper = int(min(255, (1.0 + sigma) * v))
    # lower = 100
    # upper = 200
    edged = cv.Canny(image, lower, upper)
    return edged

# 处理图片
def gray_contours_main(image):
  # method = cv.bgsegm.createBackgroundSubtractorMOG(1)
  # mask = method.apply(image)
  # cv.namedWindow('Mask', cv.WINDOW_NORMAL)
  # cv.imshow('Mask', mask)
  # cv.waitKey(0)
  # cv.destroyAllWindows()
  # kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, (5, 5))
  # mask = cv.morphologyEx(mask, cv.MORPH_CLOSE, kernel)
  # # Show the processed mask
  # cv.imshow('Processed Mask', mask)
  # res = cv.bitwise_and(image, image, mask=mask)

  # # Show the result
  # cv.imshow('Result', res)
  # cv.waitKey(0)
  # cv.destroyAllWindows()
  #高斯模糊
  #转为灰度图
  gray = cv.cvtColor(image,cv.COLOR_BGR2GRAY)
  dst = cv.GaussianBlur(gray,(3,3),0)
  #进行阈值化
  ret,binary = cv.threshold(dst,0,220,cv.THRESH_BINARY|cv.THRESH_OTSU)
  # cv.imshow("binary",binary)
  edge = auto_canny(gray)
  edge = cv.dilate(edge, None)  # 默认(3x3)
  edge = cv.erode(edge, None)
  # cv.imshow("edge",edge)
  #轮廓发现
  contours,heriachy = cv.findContours(edge.copy(),cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE)
  cv.namedWindow('contours', cv.WINDOW_NORMAL)
  cv.drawContours(image, contours, -1, (0, 0, 255), 3)
  cv.imshow("contours",image)
  # 处理数据
  lower, block = handle_data(contours, image)
  # 计算脖子block点位上下10cm的交点
  upper, down = handle_up_down_data(contours,block)
  return lower, block, upper, down

 # 计算脖子block点位上下10cm的交点
def handle_up_down_data(contours,block):
   result = []
   array_result = []
   yrect =False
   xrect = False
   yUp = block[1] - 200
   yDown = block[1] + 200
#  return result
   for i,contours_c in enumerate(contours):
      for d,  point in enumerate(contours_c):
         # 筛选出高度的坐标
         if point[0][1] > yUp and point[0][1] < yDown:
            if post_face == 'right':
              if point[0][0] > block[0]:
                 result.append(point[0])
            else:
              if point[0][0] > block[0]:
                 result.append(point[0])
      # print('轮廓点:',result)
      # npresult = np.argsort(result, axis=0)

      # data = np.array([[1,10],[3,30],[2,20]])
      # print(data)
      # sorted_data = data[data[:,1].argsort()]
      # print(sorted_data)
      if len(result)>0:
        array_result = np.array(result)
        print('轮廓点:',array_result)
        array_result = array_result[array_result[:,1].argsort()]
        length = len(array_result)
        print('轮廓点1234:',array_result[0],array_result[length-1])
        return array_result[0],array_result[length-1]
      # print('轮廓点:',np.lexsort(result))
  #       # print('轮廓index:' + str(i),d,point[0])
  #       # 筛选出高度的坐标
  #       yrect = point[0][1] > float(rect[1]) and point[0][1] < float(rect[3])
  #       xrect = point[0][0] > float(rect[0]) and point[0][0] < float(rect[2])
  #       if post_face == 'right':
  #         xrect = point[0][0] > float(rect[0]) and point[0][0] < float(rect[2])
  #       else:
  #         xrect = point[0][0] > float(rect[0]) and point[0][0] < float(rect[2])
  
  #       if yrect and xrect:
  #          result.append(point[0])


# 处理数据
# contours 轮廓列表
def handle_data(contours, image):
  result = find_lower_data(contours,post_rect)
  # print('result:',result)
  lower = find_head_left_data(result)

  # print('后脑勺点位:',lower)
  # 设置从脖子到后脑勺为止
  post_rect[1] = lower[1]
  result = find_lower_data(contours,post_rect)
  block = find_lower_point(result)
  print('脖颈最低点:',block)
  return lower, block
# 查找后脑勺位置
# 查找横向最低点
def find_head_left_data(result):
  lower = result[0]
  for i,contours_c in enumerate(result):
    # 判断x最小 面向右 最左边点为后脑勺
    if(post_face == 'right'):
      if contours_c[0] <= lower[0]:
          lower = contours_c
    else:
       if contours_c[0] >= lower[0]:
          lower = contours_c
  return lower
#rect [minx,miny,maxx,maxy]
# 查找脖颈低点位置
def find_lower_data(contours,rect):
  result = []
  yrect = False
  xrect = False
  for i,contours_c in enumerate(contours):
      for d,  point in enumerate(contours_c):
        # print('轮廓index:' + str(i),d,point[0])
        # 筛选出高度的坐标
        yrect = point[0][1] > float(rect[1]) and point[0][1] < float(rect[3])
        xrect = point[0][0] > float(rect[0]) and point[0][0] < float(rect[2])
        if post_face == 'right':
          xrect = point[0][0] > float(rect[0]) and point[0][0] < float(rect[2])
        else:
          xrect = point[0][0] > float(rect[0]) and point[0][0] < float(rect[2])
  
        if yrect and xrect:
           result.append(point[0])
  return result

# 查找横向最低点
def find_lower_point(result):
  lower = result[0]
  for i,contours_c in enumerate(result):
    if(post_face == 'right'):
      # 判断x最小
      if contours_c[0] >= lower[0]:
          lower = contours_c
    else:
        # 判断x最大
      if contours_c[0] <= lower[0]:
          lower = contours_c
  return lower

# src = cv.imread("F:/download2.png")
# iii = cv.imread("F:/download2.jpg",cv.IMREAD_UNCHANGED)
# iii = cv.imread("F:/20240318154530.jpg",cv.IMREAD_UNCHANGED)
iii = cv.imread("F:/50_20240322124808.jpg",cv.IMREAD_UNCHANGED)
# iii = cv.imread("F:/50_20240322124808000.jpg",cv.IMREAD_UNCHANGED)
# iii = cv.imread(img_url,cv.IMREAD_UNCHANGED)
# print(iii)
# cv.imshow("human",iii)
# 脖子-top之间的坐标
# xmin，y-top，xmax，y-bottom
# post_rect = [0,492,593,808]
post_face = 'left'
# post_rect = [0,430,1140,2226]
post_rect = [683,492,983,808]
lower, block,upper, down = gray_contours_main(iii)
tm = np.append(lower,block)
tm = np.append(tm,upper)
tm = np.append(tm,down)
print('lower:',','.join(str(i) for i in tm))
cv.waitKey(0)
cv.destroyAllWindows()